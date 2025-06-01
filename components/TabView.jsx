import React, {
	useState,
	useRef,
	useEffect,
	useContext,
	useCallback,
} from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	PanResponder,
	Animated,
	ScrollView,
} from 'react-native';
import ActiveOrders from './ActiveOrders'; // Import your ActiveOrders component
import NewRequests from './NewRequests'; // Import your NewRequests component
import axiosInstance from '@/utils/axiosInstance';
import { AuthContext } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { RefreshControl } from 'react-native';

const TabView = () => {
	const socket = useSocket();
	const {
		userInfo,
		checkLoginStatus,
		sendPushNotification,
	} = useContext(AuthContext);
	const [activeTab, setActiveTab] = useState('newRequests'); // Set the initial tab
	const [activeOrdersCount, setActiveOrdersCount] =
		useState(0); // State for active orders count
	const [newRequestsCount, setNewRequestsCount] =
		useState(0); // State for new requests count

	const handleActiveOrdersCountChange = (count) => {
		setActiveOrdersCount(count);
	};

	const handleNewRequestsCountChange = (count) => {
		setNewRequestsCount(count);
	};

	const [requests, setRequests] = useState([]);
	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);

	useEffect(() => {
		// Ensure socket connection is re-established
		socket.connect();

		// Cleanup: disconnect the socket when the component unmounts
		return () => {
			socket.disconnect();
		};
	}, []);

	const fetchRequests = async () => {
		try {
			const response = await axiosInstance.get(
				`/delivery/runner/${userInfo?._id}`,
			);
			setRequests(response.data.data);
			setLoading(false);
		} catch (err) {
			console.log(err.message || 'Error fetching orders');
			setLoading(false);
		}
	};

	const fetchOrders = async () => {
		try {
			const response = await axiosInstance.get(
				`/runner/orders/${userInfo?._id}`,
			);
			setOrders(response.data.data);
			setLoading(false);
		} catch (err) {
			console.log(err.message || 'Error fetching orders');
			setLoading(false);
		}
	};

	useEffect(() => {
		

		fetchRequests();
		fetchOrders();

		const handleNewRequest = (newRequest) => {
			setRequests((prevRequests) => [
				newRequest,
				...prevRequests,
			]);
		};

		const handleAcceptedRequest = async (acceptedRequestId) => {
			// Remove the accepted request from the array
			setRequests((prevRequests) =>
				prevRequests?.filter(
					(request) => request._id !== acceptedRequestId,
				),
			);
			setRequests((prevRequests) =>
				prevRequests?.filter(
					(request) => request.deliveryRequest?._id !== acceptedRequestId,
				),
			);
			
		};

		socket.on('newDeliveryRequest', handleNewRequest);
		socket.on(
			'acceptedDeliveryRequest',
			handleAcceptedRequest,
		);

		// Cleanup function
		return () => {
			socket.off('newDeliveryRequest', handleNewRequest);
			socket.off(
				'acceptedDeliveryRequest',
				handleAcceptedRequest,
			);
		};
	}, []);

	

	const onRefresh = useCallback(() => {
		setRefreshing(true);
		setTimeout(() => {
			fetchOrders()
			setRefreshing(false);
		}, 2000);
	}, []);

	return (
		<ScrollView
          contentContainerStyle={{flex: 1}}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          } style={styles.container}>
			<View style={styles.tabContainer}>
				<TouchableOpacity
					style={[
						styles.tabButton,
						activeTab === 'newRequests' && styles.activeTab,
					]}
					onPress={() => setActiveTab('newRequests')}
				>
					<Text style={styles.tabText}>
						New Requests ({requests?.length})
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[
						styles.tabButton,
						activeTab === 'activeOrders' &&
							styles.activeTab,
					]}
					onPress={() => setActiveTab('activeOrders')}
				>
					<Text style={styles.tabText}>
						Active Orders ({orders?.length})
					</Text>
				</TouchableOpacity>
			</View>

			<Animated.View style={styles.contentContainer}>
				{activeTab === 'newRequests' ? (
					<NewRequests
						requests={requests}
						onCountChange={handleNewRequestsCountChange}
						fetchRequests={fetchRequests}
						fetchOrders={fetchOrders}
					/>
				) : (
					<ActiveOrders
						orders={orders}
						onCountChange={handleActiveOrdersCountChange}
					/>
				)}
			</Animated.View>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f1f1f1',
	},
	tabContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		backgroundColor: '#fff',
		elevation: 2,
		borderTopWidth: 1,
		borderBottomWidth: 1,
		borderColor: '#ccc',
	},
	tabButton: {
		flex: 1,
		padding: 16,
		alignItems: 'center',
	},
	activeTab: {
		borderBottomWidth: 3,
		borderBottomColor: 'green',
	},
	tabText: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#000',
	},
	contentContainer: {
		flex: 1,
		paddingHorizontal: 10,
		backgroundColor: '#fff',
	},
});

export default TabView;
