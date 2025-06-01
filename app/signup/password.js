import React, { useState, useContext } from 'react';
import {
	View,
	TextInput,
	Button,
	Text,
	TouchableOpacity,
	ToastAndroid,
} from 'react-native';
import {
	useLocalSearchParams,
	useRouter,
} from 'expo-router';
import { AuthContext } from '@/context/AuthContext';

export default function NamePasswordScreen() {
	const router = useRouter();
	const [name, setName] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] =
		useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] =
		useState(false);
	const [nin, setNin] = useState('');
	const { completeProfile } = useContext(AuthContext);
	const { phoneNumber } = useLocalSearchParams();
	const [loading, setLoading] = useState(false);

	const handleNext = async () => {
		if (password !== confirmPassword) {
			ToastAndroid.show(
				'Passwords do not match.',
				ToastAndroid.SHORT,
			);
			return;
		}

		setLoading(true);

		try {
			const profile = {
				phone: phoneNumber,
				password: password,
			};
			console.log(profile);

			const response = await completeProfile(profile);
			console.log('Profile response:', response);
			if (response.message === 'Profile setup completed') {
				router.push({
					pathname: '/signup/select-campus',
					params: { phoneNumber },
				});
				ToastAndroid.show(
					`Password successfully set!`,
					ToastAndroid.LONG,
				);
				setLoading(false);
			} else {
				ToastAndroid.show(
					response.message,
					ToastAndroid.SHORT,
				);
				setLoading(false);
			}
		} catch (error) {
			ToastAndroid.show(
				'An error occurred. Please try again.',
				ToastAndroid.SHORT,
			);
			console.error('Error completing profile:', error);
			setLoading(false);
		}
	};

	return (
		<View className="flex-1 justify-center px-10">
			<Text className="text-4xl mb-2 font-bold">
				Let's secure your account
			</Text>
			{/* <Text className="text-4xl mb-2 font-bold">
				Personal information
			</Text> */}
			<Text className="text-lg mb-5">
				Enter your account password
			</Text>
			<View className="flex flex-col gap-5">
				{/* Password Input */}
				<View className="flex-row items-center mb-4 border-b border-gray-300">
					<TextInput
						value={password}
						onChangeText={setPassword}
						secureTextEntry={!showPassword}
						className="flex-1 text-xl"
						placeholder="Password"
					/>
					<TouchableOpacity
						onPress={() => setShowPassword(!showPassword)}
						className="ml-2"
					>
						<Text className="text-xl">
							{showPassword ? 'Hide' : 'Show'}
						</Text>
					</TouchableOpacity>
				</View>

				{/* Confirm Password Input */}
				<View className="flex-row items-center mb-4 border-b border-gray-300">
					<TextInput
						value={confirmPassword}
						onChangeText={setConfirmPassword}
						secureTextEntry={!showConfirmPassword}
						className="flex-1 text-xl"
						placeholder="Confirm Password"
					/>
					<TouchableOpacity
						onPress={() =>
							setShowConfirmPassword(!showConfirmPassword)
						}
						className="ml-2"
					>
						<Text className="text-xl">
							{showConfirmPassword ? 'Hide' : 'Show'}
						</Text>
					</TouchableOpacity>
				</View>
			</View>

			<TouchableOpacity
				onPress={handleNext}
				className="bg-green-500 mt-8 mb-3 py-3 rounded-lg"
			>
				<Text className="text-white text-center text-xl font-semibold">
					Continue
				</Text>
			</TouchableOpacity>
		</View>
	);
}
