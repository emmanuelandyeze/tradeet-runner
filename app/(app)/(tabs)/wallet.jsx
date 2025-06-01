import { AuthContext } from '@/context/AuthContext';
import axiosInstance from '@/utils/axiosInstance';
import React, {
	useContext,
	useEffect,
	useState,
} from 'react';
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	TouchableOpacity,
} from 'react-native';
import formatDateTime from '@/utils/formatDateTime';
import Ionicons from '@expo/vector-icons/Ionicons';

const WalletScreen = () => {
	const { logout, userInfo } = useContext(AuthContext);
	const [balance, setBalance] = useState(5000); // Example wallet balance
	const [transactions, setTransactions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null); 
	const [runnerInfo, setRunnerInfo] = useState(null)

	const getRunnerTransactions = async (runnerId) => {
		try {
			const response = await axiosInstance.get(
				`/runner/${runnerId}/transactions`,
			);
			return response.data.transactions; // Return the transactions array
		} catch (error) {
			console.error('Error fetching transactions:', error);
			throw error;
		}
	};

	const getRunnerInfo = async (runnerId) => {
		try {
			const response = await axiosInstance.get(
				`/runner/${runnerId}`,
			);
			return response.data; // Return the transactions array
		} catch (error) {
			console.error('Error fetching transactions:', error);
			throw error;
		}
	};

	const fetchRunner = async () => {
			try {
				const data = await getRunnerInfo(
					userInfo?._id,
				);
				console.log(data)
				setRunnerInfo(data.runner);
				setLoading(false);
			} catch (error) {
				setError('Could not fetch transactions');
				setLoading(false);
			}
		};

	useEffect(() => {
		const fetchTransactions = async () => {
			try {
				const data = await getRunnerTransactions(
					userInfo?._id,
				);
				setTransactions(data);
				setLoading(false);
			} catch (error) {
				setError('Could not fetch transactions');
				setLoading(false);
			}
		};

		

		fetchTransactions();
		fetchRunner();
	}, [userInfo?._id]);

	const renderTransaction = ({ item }) => (
		<View style={styles.transactionItem}>
			<View>
				<View>
					<Text
						style={{ fontWeight: 'bold', fontSize: 18 }}
					>
						{item.type}
					</Text>
					<Text style={styles.transactionText}>
						{formatDateTime(item.date)}
					</Text>
				</View>
			</View>
			<Text
				style={[
					styles.transactionText,
					item.type === 'Withdrawal'
						? styles.withdrawal
						: styles.bonus,
				]}
			>
				{item.type === 'Withdrawal' ? '-' : '+'}₦
				{item.amount}
			</Text>
		</View>
	);

	// console.log(runnerInfo)

	return (
		<View style={styles.container}>
			<View
				style={{
					marginBottom: 20,
					backgroundColor: '#fff',
					paddingVertical: 20,
					paddingHorizontal: 20,
				}}
			>
				<Text style={{ fontSize: 24, fontWeight: 'bold' }}>
					Wallet
				</Text>
			</View>
			<View
				style={{
					paddingHorizontal: 20,
				}}
			>
				<View style={styles.walletInfo}>
					<TouchableOpacity
						style={{
							display: 'flex',
							flexDirection: 'row',
							gap: 5,
							alignItems: 'center',
							backgroundColor: '#FFEDB3',
							paddingHorizontal: 10,
							borderRadius: 15,
							paddingVertical: 5,
							position: 'absolute',
							top: 20,
                            right: 20,
						}}
						onPress={() => fetchRunner()}
					>
						<Ionicons
							name="refresh"
							size={16}
							color="#1C2634"
						/>
						<Text
							style={{
								fontSize: 14,
								color: '#1C2634',
							}}
						>
							Refresh
						</Text>
					</TouchableOpacity>
					<Text style={styles.balanceTitle}>
						Available Balance
					</Text>
					<Text style={styles.balanceAmount}>
						₦{runnerInfo?.wallet?.toLocaleString() || 0.0}
					</Text>
					<TouchableOpacity
						style={styles.withdrawButton}
						onPress={() =>
							alert(
								'Withdraw functionality to be implemented',
							)
						}
					>
						<Text style={styles.withdrawButtonText}>
							Withdraw Funds
						</Text>
					</TouchableOpacity>
				</View>
			</View>

			<View
				style={{
					paddingHorizontal: 20,
				}}
			>
				<View style={styles.transactionHistory}>
					<Text style={styles.historyTitle}>
						Transaction History
					</Text>
					{loading ? (
						<View>
							<Text>Loading transactions</Text>
						</View>
					) : (
						<>
							{transactions?.length < 1 ? (
								<View
									style={{
										height: 50,
										justifyContent: 'center',
										alignItems: 'center',
									}}
								>
									<Text style={{ fontSize: 16 }}>
										No recent transactions.
									</Text>
								</View>
							) : (
								<FlatList
									data={transactions}
									renderItem={renderTransaction}
									keyExtractor={(item) => item.id}
									showsVerticalScrollIndicator={false}
								/>
							)}
						</>
					)}
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f1f1f1',
		paddingTop: 20,
	},
	walletInfo: {
		backgroundColor: '#fff',
		padding: 20,
		borderRadius: 10,
		elevation: 2,
		marginBottom: 20,
	},
	balanceTitle: {
		fontSize: 18,
		fontWeight: 'normal',
		color: '#333',
	},
	balanceAmount: {
		fontSize: 30,
		fontWeight: 'bold',
		color: '#000',
		marginVertical: 10,
	},
	transactionHistory: {
		backgroundColor: '#fff',
		borderRadius: 10,
		elevation: 2,
		padding: 10,
		marginBottom: 20,
	},
	historyTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#333',
		marginBottom: 10,
	},
	transactionItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		padding: 10,
		borderBottomWidth: 1,
		borderBottomColor: '#ccc',
		alignItems: 'center',
	},
	transactionText: {
		fontSize: 14,
		color: '#333',
	},
	withdrawal: {
		color: 'red',
	},
	bonus: {
		color: 'green',
	},
	withdrawButton: {
		backgroundColor: '#000',
		padding: 10,
		borderRadius: 5,
		alignItems: 'center',
		marginTop: 14,
	},
	withdrawButtonText: {
		color: '#fff',
		fontSize: 18,
		fontWeight: 'bold',
	},
});

export default WalletScreen;
