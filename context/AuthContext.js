import React, {
	createContext,
	useState,
	useEffect,
	useRef,
	useCallback, // Import useCallback
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '@/utils/axiosInstance';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const AuthContext = createContext();

Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: true,
		shouldSetBadge: true,
	}),
});

async function sendPushNotification(
	expoPushToken,
	title,
	msg,
) {
	const message = {
		to: expoPushToken,
		sound: 'default',
		title: title,
		body: msg,
		data: { someData: 'goes here' },
	};

	await fetch('https://exp.host/--/api/v2/push/send', {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Accept-encoding': 'gzip, deflate',
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(message),
	});
}

function handleRegistrationError(errorMessage) {
	alert(errorMessage);
	console.error(errorMessage); // Use console.error for better debugging
	// Don't throw here if you want the app to continue,
	// just log the error and handle gracefully.
}

async function registerForPushNotificationsAsync() {
	if (Platform.OS === 'android') {
		Notifications.setNotificationChannelAsync('default', {
			name: 'default',
			importance: Notifications.AndroidImportance.MAX,
			vibrationPattern: [0, 250, 250, 250],
			lightColor: '#FF231F7C',
		});
	}

	if (Device.isDevice) {
		const { status: existingStatus } =
			await Notifications.getPermissionsAsync();
		let finalStatus = existingStatus;
		if (existingStatus !== 'granted') {
			const { status } =
				await Notifications.requestPermissionsAsync();
			finalStatus = status;
		}
		if (finalStatus !== 'granted') {
			handleRegistrationError(
				'Permission not granted to get push token for push notification!',
			);
			return; // Important: return here if permission is not granted
		}
		const projectId =
			Constants?.expoConfig?.extra?.eas?.projectId ??
			Constants?.easConfig?.projectId;
		if (!projectId) {
			handleRegistrationError('Project ID not found');
			return; // Important: return here if projectId is not found
		}
		try {
			const pushTokenString = (
				await Notifications.getExpoPushTokenAsync({
					projectId,
				})
			).data;
			console.log('Expo Push Token:', pushTokenString);
			return pushTokenString;
		} catch (e) {
			handleRegistrationError(`Error getting push token: ${e}`);
			return; // Important: return here on error
		}
	} else {
		handleRegistrationError(
			'Must use physical device for push notifications',
		);
		return; // Important: return here for simulator
	}
}

export const AuthProvider = ({ children }) => {
	const [userToken, setUserToken] = useState(null); // Store the JWT token
	const [isLoading, setIsLoading] = useState(true); // Set to true initially
	const [userInfo, setUserInfo] = useState(null); // Store user information
	const [user, setUser] = useState(null); // This seems to be duplicative with userInfo, consider consolidating if possible.

	const [expoPushToken, setExpoPushToken] = useState('');
	const [isPushTokenLoading, setIsPushTokenLoading] =
		useState(true); // Keep this to track push token fetching
	const notification = useRef(null); // Use useRef for notification to avoid re-renders if it's just for logging
	const notificationListener = useRef();
	const responseListener = useRef();

	// Function to check and update the user's expoPushToken - using useCallback for stability
	const updateExpoPushToken = useCallback(
		async (token, userData) => {
			if (!token || !userData?._id || !expoPushToken) {
				console.warn(
					'Missing data for updating expoPushToken. Token:',
					token,
					'User ID:',
					userData?._id,
					'Expo Push Token:',
					expoPushToken,
				);
				return;
			}

			// Only update if the user's stored token is different from the current device token
			if (userData.expoPushToken === expoPushToken) {
				console.log('Expo token already up to date for this user.');
				return;
			}

			try {
				const response = await axiosInstance.put(
					`/runner-auth/${userData._id}/expo-token`,
					{ expoPushToken },
					{
						headers: { Authorization: `Bearer ${token}` },
					},
				);
				console.log('Expo token updated successfully:', response.data);
				// Optionally, update userInfo state to reflect the new expoPushToken
				setUserInfo((prevInfo) => ({
					...prevInfo,
					expoPushToken: expoPushToken,
				}));
			} catch (error) {
				console.error(
					'Failed to update expoPushToken:',
					error.response?.data?.message || error.message || error,
				);
			}
		},
		[expoPushToken],
	); // Dependency on expoPushToken

	// Function to get user information - using useCallback for stability
	const getUserInfo = useCallback(
		async (token) => {
			try {
				const response = await axiosInstance.get(
					'/runner-auth/me',
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					},
				);
				setUser(response.data); // Update the user state with fetched data
				setUserInfo(response.data.runner); // Set userInfo specifically for runner data
				return response.data; // Return fetched user data
			} catch (error) {
				console.error(
					'Failed to fetch user info:',
					error.response?.data?.message || error.message || error,
				);
				await logout(); // Ensure logout is awaited
				throw error; // Propagate error for handling in the UI
			}
		},
		[],
	); // No dependencies, as it's a generic fetcher

	// Function to check login status - using useCallback for stability
	const checkLoginStatus = useCallback(async () => {
		setIsLoading(true); // Start loading
		try {
			const token = await AsyncStorage.getItem('userToken');
			if (token) {
				setUserToken(token); // Set the userToken state
				const userDataResponse = await getUserInfo(token); // Fetch user info
				if (
					userDataResponse?.runner &&
					expoPushToken && // Ensure expoPushToken is available before trying to update
					userDataResponse.runner.expoPushToken !== expoPushToken
				) {
					// Only update if the stored token is different
					await updateExpoPushToken(token, userDataResponse.runner);
				}
			}
		} catch (error) {
			console.error('Error during checkLoginStatus:', error);
			// Optionally, handle specific errors, e.g., if token is invalid, log out
			await logout();
		} finally {
			setIsLoading(false); // End loading
		}
	}, [getUserInfo, updateExpoPushToken, expoPushToken]); // Dependencies for useCallback

	// Effect for fetching push token and setting up notification listeners
	useEffect(() => {
		const fetchAndSetPushToken = async () => {
			setIsPushTokenLoading(true);
			try {
				const token = await registerForPushNotificationsAsync();
				if (token) {
					setExpoPushToken(token);
				}
			} catch (error) {
				console.error('Error in registerForPushNotificationsAsync:', error);
			} finally {
				setIsPushTokenLoading(false);
			}
		};

		fetchAndSetPushToken();

		notificationListener.current =
			Notifications.addNotificationReceivedListener(
				(receivedNotification) => {
					notification.current = receivedNotification; // Update ref
					console.log('Notification Received:', receivedNotification);
					// You might want to set state here if you need to display the notification
					// setNotification(receivedNotification);
				},
			);

		responseListener.current =
			Notifications.addNotificationResponseReceivedListener(
				(response) => {
					console.log('Notification Response:', response);
				},
			);

		return () => {
			notificationListener.current &&
				Notifications.removeNotificationSubscription(
					notificationListener.current,
				);
			responseListener.current &&
				Notifications.removeNotificationSubscription(
					responseListener.current,
				);
		};
	}, []); // Empty dependency array means this runs once on mount

	// Effect for checking login status after push token is potentially available
	useEffect(() => {
		// Only run checkLoginStatus if push token is not loading and initial check hasn't happened
		if (!isPushTokenLoading) {
			checkLoginStatus();
		}
	}, [isPushTokenLoading, checkLoginStatus]); // Depend on isPushTokenLoading and checkLoginStatus

	// Login
	const login = async (phone, password) => {
		setIsLoading(true);
		try {
			const res = await axiosInstance.post('/runner-auth/login', {
				phone,
				password,
			});

			const { token } = res.data;
			await AsyncStorage.setItem('userToken', token);
			setUserToken(token); // Set the userToken state immediately

			const userData = await getUserInfo(token); // Fetch user info
			if (
				userData?.runner &&
				expoPushToken && // Ensure expoPushToken is available
				userData.runner.expoPushToken !== expoPushToken
			) {
				await updateExpoPushToken(token, userData.runner);
			}

			return res.data;
		} catch (error) {
			console.error(
				'Login error:',
				error.response?.data?.message || error.message || error,
			);
			throw error; // Re-throw to allow calling component to handle
		} finally {
			setIsLoading(false);
		}
	};

	// Register or send verification code
	const sendVerificationCode = async (phone) => {
		setIsLoading(true);
		try {
			const response = await axiosInstance.post('/runner-auth/send-code', {
				phone,
			});
			console.log(response.data);
			return response.data;
		} catch (error) {
			console.error(
				'Error sending code:',
				error.response?.data?.message || error.message || error,
			);
			throw error;
		} finally {
			setIsLoading(false);
		}
	};

	// Verify code
	const verifyCode = async (phone, code) => {
		setIsLoading(true);
		try {
			const response = await axiosInstance.post('/runner-auth/verify-code', {
				phone,
				code,
			});
			return response.data;
		} catch (error) {
			console.error(
				'Code verification failed:',
				error.response?.data?.message || error.message || error,
			);
			throw error;
		} finally {
			setIsLoading(false);
		}
	};

	// Complete profile setup
	const completeProfile = async (profileData) => {
		setIsLoading(true);
		try {
			const res = await axiosInstance.post(
				'/runner-auth/complete-profile',
				profileData,
			);
			const { token, runner } = res.data;
			setUserToken(token);
			setUserInfo(runner);
			await AsyncStorage.setItem('userToken', token);
			await AsyncStorage.setItem('userInfo', JSON.stringify(runner)); // Store stringified JSON
			return res.data;
		} catch (error) {
			console.error(
				'Profile setup failed:',
				error.response?.data?.message || error.message || error,
			);
			throw error;
		} finally {
			setIsLoading(false);
		}
	};

	// Function to complete campus profile (similar to completeProfile)
	const completeCampusProfile = async (profileData) => {
		setIsLoading(true);
		try {
			const res = await axiosInstance.post(
				'/runner-auth/complete-campus-profile',
				profileData,
			);
			const { token, runner } = res.data;
			setUserToken(token);
			setUserInfo(runner);
			await AsyncStorage.setItem('userToken', token);
			await AsyncStorage.setItem('userInfo', JSON.stringify(runner));
			return res.data;
		} catch (error) {
			console.error(
				'Campus profile setup failed:',
				error.response?.data?.message || error.message || error,
			);
			throw error; // Propagate error for handling in the UI
		} finally {
			setIsLoading(false);
		}
	};

	// Logout
	const logout = async () => {
		setIsLoading(true);
		try {
			setUserToken(null);
			setUserInfo(null);
			setUser(null); // Also clear the 'user' state
			await AsyncStorage.removeItem('userToken');
			await AsyncStorage.removeItem('userInfo');
			console.log('User logged out successfully.');
		} catch (error) {
			console.error('Logout failed:', error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<AuthContext.Provider
			value={{
				login,
				sendVerificationCode,
				verifyCode,
				completeProfile,
				logout,
				userToken,
				userInfo,
				isLoading,
				completeCampusProfile,
				user, // If 'user' state is truly needed separately from 'userInfo.runner'
				sendPushNotification,
				expoPushToken,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};