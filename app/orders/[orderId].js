import React, {
	useContext,
	useEffect,
	useState,
} from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Modal,
	TextInput,
	FlatList,
	KeyboardAvoidingView,
	Platform,
	ActivityIndicator,
	Linking,
	ScrollView,
	Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import axiosInstance from '@/utils/axiosInstance';
import LoadingScreen from '@/components/LoadingScreen';
import { AuthContext } from '@/context/AuthContext';
import { useRouter } from 'expo-router';

const OrderDetails = () => {
	const { userInfo, sendPushNotification } =
		useContext(AuthContext);
	const { orderId } = useLocalSearchParams();
	const [order, setOrder] = useState(null);
	const [loading, setLoading] = useState(false);
	const [showChat, setShowChat] = useState(false);
	const [chatMessages, setChatMessages] = useState([]);
	const [newMessage, setNewMessage] = useState('');
	const [deliveryCode, setDeliveryCode] = useState('');
	const router = useRouter();

	// Function to handle the button press
	const handleCompleteDelivery = async () => {
		if (deliveryCode.length === 4) {
			// Perform the action for completing the delivery here
			try {
				const response = await axiosInstance.post(
					`/runner/${userInfo?._id}/order/${orderId}/delivered`,
					{ deliveryCode },
				);
				// console.log(response);
				if (response.status !== 200) {
					Alert.alert(
						'Error',
						'Delivery code is incorrect',
					);
				} else {
					Alert.alert(
						'Success',
						'Delivery marked as complete',
					);
					await sendPushNotification(
						order?.customerInfo?.expoPushToken,
						'Order delivered',
						'Your order has been completed successfully',
					);
					setLoading(false);
					router.back();
				}
			} catch (err) {
				console.log(err.message || 'Error fetching orders');
				setLoading(false);
			}
		} else {
			Alert.alert(
				'Error',
				'Please enter a valid 4-digit delivery code',
			);
		}
	};

	useEffect(() => {
		const fetchOrder = async () => {
			try {
				setLoading(true);
				const response = await axiosInstance.get(
					`/orders/${orderId}`,
				);
				setOrder(response.data);
				setLoading(false);
			} catch (err) {
				console.log(err.message || 'Error fetching orders');
				setLoading(false);
			}
		};

		fetchOrder();
	}, [orderId]);

	const handlePayRestaurant = () => {
		setLoading(true);
		// Simulate payment processing
		setTimeout(() => {
			setLoading(false);
			alert('Payment processed successfully!');
			sendPushNotification(
				order?.customerInfo?.expoPushToken,
				'Order picked up',
				`Your runner is on the way. Use the code, ${order?.deliveryCode} to receive your order.`,
			);
			sendPushNotification(
				order?.storeId?.expoPushToken,
				'Payment received',
				`You just received, ₦${order?.itemsAmount} for order #${order?.orderNumber} to your ${order?.storeId?.paymentInfo[0]?.bankName} account. Please confirm with your bank.`,
			);
		}, 2000); // Simulates a 2-second loading time
	};

	const handleChatToggle = () => {
		setShowChat(!showChat);
	};

	const handleSendMessage = () => {
		if (newMessage.trim()) {
			// Add the user's message to the chat
			setChatMessages((prevMessages) => [
				...prevMessages,
				{ text: newMessage, sender: 'user' },
			]);
			setNewMessage('');

			// Simulate a response from the customer
			setTimeout(() => {
				setChatMessages((prevMessages) => [
					...prevMessages,
					{
						text: 'Thank you for your message!',
						sender: 'customer',
					},
				]);
			}, 2000); // Simulates a delay for customer response
		}
	};

	const handleCallCustomer = () => {
		// Format the phone number and initiate a call
		Linking.openURL(
			`tel:${order?.customerInfo?.contact}`,
		).catch((err) => console.log('Error:', err));
	};

	if (loading) return <LoadingScreen />;

	if (!order) {
		return (
			<View style={styles.container}>
				<Text>Order not found...</Text>
			</View>
		);
	}

	return (
		<ScrollView style={styles.container}>
			<View style={styles.headerContainer}>
				<TouchableOpacity onPress={() => router.back()}>
					<Ionicons
						name="chevron-back"
						size={28}
						color="black"
					/>
				</TouchableOpacity>
				<Text style={styles.header}>
					Order Details (#{order.orderNumber})
				</Text>
			</View>
			<View style={styles.orderInfo}>
				<Text style={styles.detailText}>
					Pickup Location: {order?.storeId?.name} (
					{order?.storeId?.address})
				</Text>
				<Text style={styles.detailText}>
					Drop-off Location: {order?.customerInfo?.address}
				</Text>

				<Text style={styles.itemsHeader}>
					Ordered Items:
				</Text>
				{order.items.map((item, index) => (
					<View
						style={{
							display: 'flex',
							flexDirection: 'row',
							justifyContent: 'space-between',
						}}
						key={index}
					>
						<View>
							{item.variants.length > 0 && (
								<View>
									{item.variants.map((variant, index) => (
										<Text
											style={{
												fontSize: 16,
												marginBottom: 5,
											}}
											key={index}
										>
											{variant.name} (x{variant.quantity})
										</Text>
									))}
								</View>
							)}
							{item.addOns.length > 0 && (
								<View>
									{item.addOns.map((addOn, index) => (
										<Text
											style={{
												fontSize: 16,
												marginBottom: 5,
											}}
											key={index}
										>
											{addOn.name} (x{addOn.quantity})
										</Text>
									))}
								</View>
							)}
						</View>
						<Text style={{ fontSize: 16 }}>
							₦{item.totalPrice}
						</Text>
					</View>
				))}
				{/* Display the Total Price */}
				<Text
					style={{
						borderTopWidth: 1,
						paddingTop: 20,
						fontSize: 20,
						fontWeight: 'bold',
						marginTop: 20,
						textAlign: 'center',
					}}
				>
					Total Price: ₦{order?.itemsAmount}
				</Text>
			</View>

			{/* Buttons for Customer Communication and Payment */}
			{order?.status === 'completed' ? null : (
				<View style={styles.buttonContainer}>
					<TouchableOpacity
						style={{
							backgroundColor: '#fff',
							borderRadius: 8,
							padding: 10,
							width: '48%',
							alignItems: 'center',
							borderWidth: 1,
						}}
						onPress={handleChatToggle}
					>
						<Text style={styles.buttonText}>
							Talk to Customer
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={{
							backgroundColor: 'green',
							borderRadius: 8,
							padding: 10,
							width: '48%',
							alignItems: 'center',
						}}
						onPress={handlePayRestaurant}
					>
						<Text style={{ color: '#fff', fontSize: 18 }}>
							Pay Vendor
						</Text>
					</TouchableOpacity>
				</View>
			)}

			{order?.status === 'completed' ? null : (
				<View style={{ paddingHorizontal: 14 }}>
					<Text
						style={{ fontSize: 20, fontWeight: 'bold' }}
					>
						Complete Delivery
					</Text>
					<Text>
						Enter the 4-digit pin from the customer.
					</Text>
					<TextInput
						style={styles.dinput}
						value={deliveryCode}
						onChangeText={setDeliveryCode}
						keyboardType="numeric"
						maxLength={4}
						placeholder="Enter 4-digit code"
					/>

					<TouchableOpacity
						style={[
							styles.button,
							{
								backgroundColor:
									deliveryCode.length === 4
										? '#4CAF50'
										: '#B0BEC5',
							},
						]}
						onPress={handleCompleteDelivery}
						disabled={deliveryCode.length !== 4}
					>
						<Text style={styles.buttonText}>
							Mark as delivered
						</Text>
					</TouchableOpacity>
				</View>
			)}

			{/* Chat Modal */}
			<Modal
				animationType="slide"
				transparent={true}
				visible={showChat}
				onRequestClose={handleChatToggle}
			>
				<View style={styles.modalContainer}>
					<KeyboardAvoidingView
						style={styles.chatContainer}
						behavior={
							Platform.OS === 'ios' ? 'padding' : 'height'
						}
					>
						<FlatList
							data={chatMessages}
							keyExtractor={(item, index) =>
								index.toString()
							}
							renderItem={({ item }) => (
								<View
									style={[
										styles.messageContainer,
										item.sender === 'user'
											? styles.userMessage
											: styles.customerMessage,
									]}
								>
									<Text style={styles.messageText}>
										{item.text}
									</Text>
								</View>
							)}
						/>

						<View style={styles.inputContainer}>
							{/* Call Button */}
							<TouchableOpacity
								style={styles.callButton}
								onPress={handleCallCustomer}
							>
								<Ionicons
									name="call"
									size={24}
									color="#6200ee"
								/>
							</TouchableOpacity>
							<TextInput
								style={styles.input}
								placeholder="Type your message..."
								value={newMessage}
								onChangeText={setNewMessage}
								onSubmitEditing={handleSendMessage}
							/>
							<TouchableOpacity
								style={styles.sendButton}
								onPress={handleSendMessage}
							>
								<Ionicons
									name="send"
									size={24}
									color="#fff"
								/>
							</TouchableOpacity>
						</View>
					</KeyboardAvoidingView>
				</View>
			</Modal>

			{/* Loading Indicator */}
			{loading && (
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color="#000" />
					<Text style={styles.loadingText}>
						Processing Payment...
					</Text>
				</View>
			)}
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
	},
	headerContainer: {
		paddingHorizontal: 10,
		paddingTop: 38,
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'center',
		paddingBottom: 16,
		gap: 10,
	},
	header: {
		fontSize: 24,
		fontWeight: 'bold',
	},
	orderInfo: {
		padding: 16,
	},
	detailText: {
		fontSize: 18,
		marginBottom: 12,
	},
	itemsHeader: {
		fontSize: 20,
		fontWeight: 'bold',
		marginTop: 16,
		marginBottom: 8,
	},
	itemText: {
		fontSize: 16,
		marginBottom: 4,
	},
	buttonContainer: {
		flexDirection: 'row',
		// justifyContent: 'space-around',
		padding: 16,
		gap: 10,
	},
	button: {
		backgroundColor: '#27D367',
		borderRadius: 8,
		padding: 10,
		width: '48%',
		alignItems: 'center',
	},
	buttonText: {
		color: '#000',
		fontSize: 18,
	},
	modalContainer: {
		flex: 1,
		justifyContent: 'flex-end',
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
	},
	chatContainer: {
		backgroundColor: '#fff',
		borderTopLeftRadius: 15,
		borderTopRightRadius: 15,
		padding: 20,
		maxHeight: '70%',
	},
	messageContainer: {
		padding: 10,
		borderRadius: 15,
		marginVertical: 5,
		maxWidth: '70%',
	},
	userMessage: {
		backgroundColor: '#e1ffc7',
		alignSelf: 'flex-end',
	},
	customerMessage: {
		backgroundColor: '#f1f1f1',
		alignSelf: 'flex-start',
	},
	messageText: {
		fontSize: 16,
	},
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 10,
	},
	input: {
		flex: 1,
		borderWidth: 1,
		borderColor: '#ccc',
		borderRadius: 20,
		padding: 10,
		marginRight: 10,
		height: 40,
	},
	dinput: {
		height: 50,
		borderColor: '#ddd',
		borderWidth: 1,
		borderRadius: 5,
		marginBottom: 20,
		paddingHorizontal: 10,
		fontSize: 16,
		marginTop: 5,
	},
	sendButton: {
		backgroundColor: '#27D367',
		padding: 10,
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingContainer: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(255, 255, 255, 0.8)',
		zIndex: 1,
	},
	loadingText: {
		marginTop: 10,
		fontSize: 18,
	},
	callButton: {
		backgroundColor: '#f1f1f1',
		padding: 10,
		borderRadius: 50,
		marginRight: 5,
	},
});

export default OrderDetails;
