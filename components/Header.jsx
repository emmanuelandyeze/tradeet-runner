import React, { useState } from 'react';
import {
	View,
	Text,
	Image,
	Switch,
	StyleSheet,
	Alert,
	ToastAndroid,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import axiosInstance from '@/utils/axiosInstance';

export default function Header({
	profileImage,
	campus,
	name,
	userInfo,
	runnerId,
}) {
	const [isOnline, setIsOnline] = useState(
		userInfo?.isActive,
	);

	console.log(isOnline)

	const toggleRunnerStatus = async () => {
		// Check if the user is approved before allowing toggle
		if (!userInfo?.isApproved) {
			Alert.alert(
				'Profile Under Review',
				'Your profile is currently in review. Please wait for approval.',
			);
			return;
		}
		
		// Toggle local state immediately for a responsive UI
		setIsOnline((previousState) => !previousState);

		try {
			// Make the API request to update the backend status
			const response = await axiosInstance.patch(
				`/runner/${runnerId}/toggleActive`,
				{ isActive: isOnline },
				{ headers: { 'Content-Type': 'application/json' } },
			);

			if (response.status !== 200) {
				// Revert the state if there was an error
				setIsOnline((previousState) => !previousState);
				ToastAndroid.showWithGravity(
					response.data.message ||
						'Failed to update status',
					ToastAndroid.SHORT,
					ToastAndroid.CENTER,
				);
			} else {
				// Update the status in the app
				ToastAndroid.showWithGravity(
					isOnline === false
						? 'You are now active'
						: 'You are now offline',
					ToastAndroid.LONG,
					ToastAndroid.CENTER,
				);
			}
		} catch (error) {
			// Revert the state if there's a network error or any other issue
			setIsOnline((previousState) => !previousState);
			ToastAndroid.showWithGravity(
				'Failed to update status. Please try again.',
				ToastAndroid.SHORT,
				ToastAndroid.CENTER,
			);
		}
	};

	return (
		<View style={styles.headerContainer}>
			<View style={styles.userInfo}>
				<Image
					source={{ uri: profileImage }}
					style={styles.profileImage}
				/>
				<View style={styles.textContainer}>
					<Text style={styles.welcomeText}>{name}</Text>
					<View style={styles.locationContainer}>
						<Ionicons
							name="location-outline"
							size={16}
							color="gray"
						/>
						<Text style={styles.campusText}>{campus}</Text>
					</View>
				</View>
			</View>
			<View style={styles.toggleContainer}>
				<Text
					style={{
						marginRight: 8,
						fontSize: 16,
						color: isOnline ? 'green' : 'red',
					}}
				>
					{isOnline ? 'Online' : 'Offline'}
				</Text>
				<Switch
					trackColor={{ false: '#767577', true: '#f5dd4b' }}
					thumbColor={isOnline ? 'green' : '#f4f3f4'}
					onValueChange={toggleRunnerStatus}
					value={isOnline}
				/>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	headerContainer: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingTop: 45,
		paddingBottom: 15,
		paddingLeft: 20,
		paddingRight: 20,
		backgroundColor: '#fff',
		flexDirection: 'row',
		zIndex: 100,
		position: 'fixed',
		top: 0,
		left: 0,
		right: 0,
	},
	userInfo: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	profileImage: {
		height: 50,
		width: 50,
		borderRadius: 50,
		marginBottom: 4,
	},
	textContainer: {
		marginLeft: 10,
	},
	welcomeText: {
		fontSize: 18,
		fontWeight: 'bold',
	},
	locationContainer: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	campusText: {
		color: 'gray',
		fontSize: 16,
		marginLeft: 4,
	},
	toggleContainer: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	statusText: {
		fontSize: 16,
	},
});
