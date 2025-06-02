import React, {
	createContext,
	useState,
	useEffect,
	useRef,
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
	throw new Error(errorMessage);
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
			return;
		}
		const projectId =
			Constants?.expoConfig?.extra?.eas?.projectId ??
			Constants?.easConfig?.projectId;
		if (!projectId) {
			handleRegistrationError('Project ID not found');
		}
		try {
			const pushTokenString = (
				await Notifications.getExpoPushTokenAsync({
					projectId,
				})
			).data;
			console.log(pushTokenString);
			return pushTokenString;
		} catch (e) {
			handleRegistrationError(`${e}`);
		}
	} else {
		handleRegistrationError(
			'Must use physical device for push notifications',
		);
	}
}

export const AuthProvider = ({ children }) => {
	const [userToken, setUserToken] = useState(null); // Store the JWT token
	const [isLoading, setIsLoading] = useState(false);
	const [userInfo, setUserInfo] = useState(null); // Store user information
	const [user, setUser] = useState(null);

	const [expoPushToken, setExpoPushToken] = useState('');
	const [isPushTokenLoading, setIsPushTokenLoading] =
		useState(true);
	const [notification, setNotification] =
		useState(undefined);
	const notificationListener = useRef();
	const responseListener = useRef();

	useEffect(() => {
		const fetchPushToken = async () => {
			try {
				const token =
					await registerForPushNotificationsAsync();
				if (token) setExpoPushToken(token);
			} catch (error) {
				console.error('Error fetching push token:', error);
			} finally {
				setIsPushTokenLoading(false);
			}
		};

		fetchPushToken();

		notificationListener.current =
			Notifications.addNotificationReceivedListener(
				(notification) => {
					setNotification(notification);
				},
			);

		responseListener.current =
			Notifications.addNotificationResponseReceivedListener(
				(response) => {
					console.log(response);
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
	}, []);

	console.log(expoPushToken);

	// Function to check and update the user's expoPushToken
	const updateExpoPushToken = async (token, userData) => {
		if (!expoPushToken) {
			console.warn('Expo Push Token is not available yet.');
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
			console.log('Expo token updated:', response.data);
		} catch (error) {
			console.error(
				'Failed to update expoPushToken:',
				error.response?.data || error,
			);
		}
	};

	// Function to check login status
	const checkLoginStatus = async () => {
		setIsLoading(true);
		try {
			const token = await AsyncStorage.getItem('userToken');
			// console.log('Retrieved token:', token);
			if (token) {
				setUser({ token }); // Set user with token

				// Wait until push token is ready
				while (!expoPushToken) {
					await new Promise((resolve) =>
						setTimeout(resolve, 100),
					);
				}

				// Fetch and set user info
				const userData = await getUserInfo(token);
				if (
					userData &&
					userData.runner &&
					!userData.runner.expoPushToken
				) {
					await updateExpoPushToken(token, userData.runner);
				}

				if (userData.runner) setUserInfo(userData.runner);
			}
		} catch (error) {
			console.error('Failed to fetch token:', error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		// logout()
		checkLoginStatus();
	}, [expoPushToken]);

	// console.log(userInfo);
	// Login
	const login = async (phone, password) => {
		setIsLoading(true);
		console.log(phone, password);
		try {
			const res = await axiosInstance.post(
				'/runner-auth/login',
				{ phone, password },
			);

			const { token } = res.data;

			await AsyncStorage.setItem('userToken', token); // Store token

			// Fetch and set user info
			const userData = await getUserInfo(token);
			if (userData && userData.runner) {
				setUserInfo(userData.runner);
			}

			return res.data;
		} catch (error) {
			console.log('Login error:', error);
		} finally {
			setIsLoading(false);
		}
	};

	// Register or send verification code
	const sendVerificationCode = async (phone) => {
		setIsLoading(true);
		try {
			const response = await axiosInstance.post(
				'/runner-auth/send-code',
				{
					phone,
				}, 
			);
			console.log(response);
			return response.data;
		} catch (error) {
			console.log('Error sending code:', error);
		} finally {
			setIsLoading(false);
		}
	};

	// Verify code
	const verifyCode = async (phone, code) => {
		setIsLoading(true);
		try {
			const response = await axiosInstance.post(
				'/runner-auth/verify-code',
				{
					phone,
					code,
				},
			);
			return response.data;
		} catch (error) {
			console.log('Code verification failed:', error);
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
			// console.log(res.data);
			const { token, runner } = res.data;
			setUserToken(token);
			setUserInfo(runner);
			console.log(runner);
			await AsyncStorage.setItem('userToken', token);
			await AsyncStorage.setItem(
				'userInfo',
				JSON.stringify(runner),
			);
			return res.data;
		} catch (error) {
			console.log('Profile setup failed:', error);
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
			await AsyncStorage.setItem(
				'userInfo',
				JSON.stringify(runner),
			);
			return res.data;
		} catch (error) {
			console.error(error.response?.data || error);
			throw error; // Propagate error for handling in the UI
		} finally {
			setIsLoading(false);
		}
	};

	// Function to get user information
	const getUserInfo = async (token) => {
		try {
			// console.log('Fetching user info with token:', token);
			const response = await axiosInstance.get(
				'/runner-auth/me',
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			);
			// console.log('User info response:', response.data);
			setUser(response.data); // Update the user state with fetched data
			return response.data; // Return fetched user data
		} catch (error) {
			console.error(
				'Failed to fetch user info:',
				error.response?.data || error,
			);
			await logout(); // Ensure logout is awaited
			throw error; // Propagate error for handling in the UI
		}
	};

	// Logout
	const logout = async () => {
		setIsLoading(true);
		try {
			setUserToken(null);
			setUserInfo(null);
			await AsyncStorage.removeItem('userToken');
			await AsyncStorage.removeItem('userInfo');
		} catch (error) {
			console.log('Logout failed:', error);
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
				user,
				sendPushNotification,
				expoPushToken,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};
