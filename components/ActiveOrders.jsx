import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
	View,
	Text,
	FlatList,
	TouchableOpacity,
	StyleSheet,
} from 'react-native';

const ActiveOrders = ({ onCountChange, orders }) => {
	const [filteredOrders, setFilteredOrders] =
		useState(orders);
	const [filter, setFilter] = useState('in progress');

	// Effect to update the count of active orders whenever the orders list changes
	useEffect(() => {
		onCountChange(orders.length);
		filterOrders();
	}, [orders, filter]);

	// Function to filter orders based on status
	const filterOrders = () => {
		if (filter === 'in progress') {
			setFilteredOrders(
				orders.filter((order) => order.status === filter),
			);
		} else {
			setFilteredOrders(
				orders.filter((order) => order.status === filter),
			);
		}
	};

	const renderOrder = ({ item }) => (
		<TouchableOpacity
			style={{
				backgroundColor:
					item.status === 'in progress'
						? 'white'
						: 'white',
				padding: 12,
				borderWidth: 1,
				borderColor: item.status === 'in progress'
						? '#ccc'
						: 'green',
				borderRadius: 5,
				marginBottom: 10
				
			}}
			onPress={() => router.push(`/orders/${item._id}`)}
		>
			<Text style={styles.title}>
				{item?.storeId?.name}
			</Text>
			<Text style={styles.ssubtitle}>
				{item?.storeId?.address}
			</Text>
			<Text style={styles.subtitle}>
				Drop-off: {item?.customerInfo?.address}
			</Text>
			<Text style={styles.status}>
				Status: {item.status}
			</Text>
		</TouchableOpacity>
	);

	return (
		<View style={styles.container}>
			{/* Filter buttons */}
			<View style={styles.filterContainer}>
				
				<TouchableOpacity
					style={[
						styles.filterButton,
						filter === 'in progress' &&
							styles.activeFilterButton,
					]}
					onPress={() => setFilter('in progress')}
				>
					<Text style={styles.filterText}>In Progress</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[
						styles.filterButton,
						filter === 'completed' &&
							styles.activeFilterButton,
					]}
					onPress={() => setFilter('completed')}
				>
					<Text style={styles.filterText}>Completed</Text>
				</TouchableOpacity>
			</View>

			<View style={{paddingTop: 48}}>
				<FlatList
					data={filteredOrders}
					keyExtractor={(item) => item._id}
					renderItem={renderOrder}
					ListEmptyComponent={
						<View
							style={{
								justifyContent: 'center',
								height: 550,
							}}
						>
							<Text
								style={{
									textAlign: 'center',
									fontSize: 20,
								}}
							>
								No active orders
							</Text>
						</View>
					}
				/>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	filterContainer: {
		flexDirection: 'row',
		// justifyContent: 'space-around',
		paddingVertical: 5,
		gap: 8,
		marginVertical: 5,
		position: 'absolute',
		left: 0,
		top: 0,
		backgroundColor: '#fff',
		width: '100%',
		zIndex: 100,
	},
	filterButton: {
		paddingVertical: 5,
		paddingHorizontal: 16,
		borderRadius: 20,
		backgroundColor: '#ddd',
	},
	activeFilterButton: {
		backgroundColor: '#f5dd4b',
	},
	filterText: {
		color: '#121212',
		fontSize: 14,
		// fontWeight: 'bold',
	},
	header: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 16,
		padding: 16,
	},
	orderCard: {
		backgroundColor: '#fff',
		padding: 12,
		marginVertical: 8,
		borderRadius: 4,
		elevation: 1,
	},
	title: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#121212',
	},
	subtitle: {
		fontSize: 16,
		color: '#121212',
		fontWeight: 'bold',
	},
	ssubtitle: {
		fontSize: 14,
		color: '#121212',
	},
	status: {
		fontSize: 14,
		color: '#121212',
		textTransform: 'capitalize',
	},
	eta: {
		fontSize: 14,
		color: '#888',
	},
});

export default ActiveOrders;
