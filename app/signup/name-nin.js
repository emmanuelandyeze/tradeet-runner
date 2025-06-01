import React, { useState, useContext } from 'react';
import {
	View,
	TextInput,
	Text,
	TouchableOpacity,
	Image,
	Modal,
	StyleSheet,
	ToastAndroid,
} from 'react-native';
import {
	useLocalSearchParams,
	useRouter,
} from 'expo-router';
import { AuthContext } from '@/context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import * as Camera from 'expo-camera';
import { uploadImageToCloudinary } from '../../utils/cloudinary';

export default function NameNinScreen() {
	const router = useRouter();
	const [name, setName] = useState('');
	const [nin, setNin] = useState('');
	const [image, setImage] = useState(null);
	const [modalVisible, setModalVisible] = useState(false);
	const [status] = ImagePicker.useCameraPermissions();
	const { completeProfile } = useContext(AuthContext);
	const { phoneNumber } = useLocalSearchParams();
	const [loading, setLoading] = useState(false);

	// Function to open ImagePicker
	const pickImage = async () => {
		let result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [1, 1], // Square image
			quality: 1,
		});

		console.log(result);
		if (!result.canceled) {
			setImage(result.assets[0].uri);
			setModalVisible(false); // Close modal after selection
		}
	};

	// Function to open Camera
	const takePhoto = async () => {
		ImagePicker.requestCameraPermissionsAsync();
		let result = await ImagePicker.launchCameraAsync({
			allowsEditing: true,
			aspect: [1, 1], // Square image
			quality: 1,
		});

		if (!result.canceled) {
			setImage(result.assets[0].uri);
			setModalVisible(false); // Close modal after taking a photo
		}
	};

	// Function to handle image upload to Cloudinary
	const handleImageUpload = async () => {
		if (image) {
			const response = await uploadImageToCloudinary(image);
			if (response.secure_url) {
				console.log('Cloudinary URL:', response.secure_url);
				return response.secure_url;
			} else {
				alert('Failed to upload image');
			}
		} else {
			alert('No image selected');
		}
	};

	const handleNext = async () => {
		if (!name) {
			ToastAndroid.show(
				'Please enter your name',
				ToastAndroid.SHORT,
			);
			return;
		}

		if (!nin || nin.length < 11) {
			ToastAndroid.show(
				'Please enter your valid NIN',
				ToastAndroid.SHORT,
			);
			return;
		}

		if (!image) {
			ToastAndroid.show(
				'Please select an image for your profile',
				ToastAndroid.SHORT,
			);
			return;
		}

		const image_url = await handleImageUpload();

		setLoading(true);

		try {
			const profile = {
				name: name,
				phone: phoneNumber,
				nin: nin,
				profileImage: image_url,
			};
			console.log(profile);

			const response = await completeProfile(profile);
			console.log('Profile response:', response);
			if (response.message === 'Profile setup completed') {
				router.push({
					pathname: '/signup/password',
					params: { phoneNumber },
				});
				ToastAndroid.show(
					`Welcome to Tradeet Runner, ${name}!`,
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
				Just some more details
			</Text>
			<Text className="text-lg mb-5">
				Help us verify your identity
			</Text>
			<View className="flex flex-col gap-5">
				{/* Image Upload Section */}
				<TouchableOpacity
					onPress={() => setModalVisible(true)}
					style={{
						display: 'flex',
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<View style={styles.dottedCircle}>
						{image ? (
							<Image
								source={{ uri: image }}
								style={styles.imagePreview}
							/>
						) : (
							<Text style={styles.uploadText}>
								Upload a profile picture
							</Text>
						)}
					</View>
				</TouchableOpacity>
				<TextInput
					value={name}
					onChangeText={setName}
					className="border-b text-xl border-gray-300 mb-4"
					placeholder="Your Full Name"
				/>

				{/* NIN Input */}
				<View className="flex-row items-center mb-4 border-b border-gray-300">
					<TextInput
						value={nin}
						onChangeText={setNin}
						keyboardType="numeric"
						maxLength={11}
						className="flex-1 text-xl"
						placeholder="NIN"
					/>
					<Text className="ml-2 text-xl">(11 digits)</Text>
				</View>

				{/* Modal for Image Picker Options */}
				<Modal
					animationType="slide"
					transparent={true}
					visible={modalVisible}
					onRequestClose={() => setModalVisible(false)}
				>
					<View style={styles.modalContainer}>
						<View style={styles.modalView}>
							<TouchableOpacity
								onPress={takePhoto}
								style={styles.modalButton}
							>
								<Text style={styles.modalButtonText}>
									Take a Photo
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={pickImage}
								style={styles.modalButton}
							>
								<Text style={styles.modalButtonText}>
									Choose from Gallery
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={() => setModalVisible(false)}
								style={styles.modalCancelButton}
							>
								<Text style={styles.modalButtonText}>
									Cancel
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</Modal>
			</View>

			<TouchableOpacity
				onPress={() => handleNext()}
				className="bg-green-500 mt-8 mb-3 py-3 rounded-lg"
			>
				<Text className="text-white text-center text-xl font-semibold">
					{loading ? 'Loading...' : 'Continue'}
				</Text>
			</TouchableOpacity>
		</View>
	);
}

// Styles
const styles = StyleSheet.create({
	dottedCircle: {
		borderWidth: 2,
		borderColor: '#ccc',
		borderStyle: 'dotted',
		borderRadius: 100, // Fully rounded circle
		width: 200,
		height: 200,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 20,
	},
	uploadText: {
		color: '#999',
		fontSize: 16,
		textAlign: 'center',
	},
	imagePreview: {
		width: 200,
		height: 200,
		borderRadius: 100, // Fully rounded image to fit the circle
	},
	modalContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
	},
	modalView: {
		width: 300,
		backgroundColor: 'white',
		borderRadius: 10,
		padding: 20,
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 5,
	},
	modalButton: {
		width: '100%',
		padding: 15,
		backgroundColor: '#2196F3',
		borderRadius: 10,
		marginBottom: 10,
		alignItems: 'center',
	},
	modalCancelButton: {
		width: '100%',
		padding: 15,
		backgroundColor: '#FF3B30',
		borderRadius: 10,
		marginTop: 10,
		alignItems: 'center',
	},
	modalButtonText: {
		color: 'white',
		fontSize: 16,
		fontWeight: 'bold',
	},
});
