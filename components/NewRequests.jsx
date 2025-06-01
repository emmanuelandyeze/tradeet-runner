import React, {
	useContext,
	useEffect,
	useState,
} from 'react';
import {
	View,
	Text,
	FlatList,
	TouchableOpacity,
	StyleSheet,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import axiosInstance from '@/utils/axiosInstance';
import { useSocket } from '@/context/SocketContext';

const NewRequests = ({ onCountChange, requests, fetchRequests, fetchOrders }) => {
	// console.log('hey', requests)
	const socket = useSocket();
	const [loading, setLoading] = useState(false);
	const newRequests = requests;

	const handleAcceptRequest = async (request) => {
		setLoading(true); // Start loading

		console.log('req', request);
		try {
			const response = await axiosInstance.post(
				`delivery/accept`,
				{
					requestId: request?._id,
					runnerId: request?.runnerInfo?.runnerId,
				},
			);

			if (response.data.deliveryRequest) {
				console.log(
					'Emitting order update:',
					response.data.deliveryRequest,
				);
				socket.emit(
					'acceptedDeliveryRequest',
					response.data.deliveryRequest,
					(error) => {
						if (error) {
							console.error('Error updating order:', error);
						} else {
							console.log('Request updated successfully');
						}
					},
				);
				fetchRequests()
				fetchOrders();
			} else {
				console.error('Order not found in response data');
			}
		} catch (err) {
			console.error('Error in handleAcceptOrder:', err);
		} finally {
			setLoading(false); // Always stop loading
		}
	};

	const renderRequest = ({ item }) => (
		<View style={styles.requestCard}>
			<View style={{ width: '70%' }}>
				<Text style={styles.title}>
					{item?.storeName ||
						item?.deliveryRequest?.storeName}
				</Text>
				<Text style={styles.ssubtitle}>
					{item?.pickupAddress ||
						item?.deliveryRequest?.pickupAddress}
				</Text>
				<Text style={styles.subtitle}>
					Drop-off:{' '}
					{item?.deliveryAddress ||
						item?.deliveryRequest?.deliveryAddress}
				</Text>
				<Text style={styles.status}>
					Status:{' '}
					{item?.status || item?.deliveryRequest?.status}
				</Text>
			</View>
			<View
				style={{
					display: 'flex',
					flexDirection: 'row',
					gap: 20,
				}}
			>
				<TouchableOpacity
					style={{
						backgroundColor: 'red',
						padding: 5,
						borderRadius: 20,
					}}
				>
					<MaterialCommunityIcons
						name="cancel"
						size={24}
						color="white"
					/>
				</TouchableOpacity>
				<TouchableOpacity
					style={{
						backgroundColor: 'green',
						padding: 5,
						borderRadius: 20,
					}}
					onPress={() =>
						handleAcceptRequest(
							item?.deliveryRequest || item,
						)
					}
				>
					<Ionicons
						name="checkmark-done"
						size={24}
						color="white"
					/>
				</TouchableOpacity>
			</View>
		</View>
	);

	return (
		<View style={styles.container}>
			{/* <Text style={styles.header}>New Requests</Text> */}
			<FlatList
				data={newRequests}
				keyExtractor={(item) =>
					item?.id || item?.deliveryRequest?._id
				}
				renderItem={renderRequest}
				ListEmptyComponent={
					<View
						style={{
							justifyContent: 'center',
							alignItems: 'center',
							height: 350,
						}}
					>
						<Text
							style={{
								fontSize: 18,
								fontWeight: 'semibold',
							}}
						>
							No new requests at the moment.
						</Text>
					</View>
				}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 16,
		padding: 16,
	},
	requestCard: {
		backgroundColor: '#fff',
		padding: 12,
		marginVertical: 8,
		// borderRadius: 4,
		elevation: 1,
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	title: {
		fontSize: 18,
		fontWeight: 'bold',
	},
	subtitle: {
		fontSize: 16,
		color: '#555',
		width: '100%',
		fontWeight: 'bold',
	},
	ssubtitle: {
		fontSize: 14,
		color: '#555',
		width: '100%',
	},
	status: {
		fontSize: 14,
		color: '#00aaff',
	},
});

export default NewRequests;
