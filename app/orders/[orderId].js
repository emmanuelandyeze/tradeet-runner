import React, {
    useContext,
    useEffect,
    useState,
    useCallback, // Added for memoization
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
    SafeAreaView, // Added for better layout on different devices
} from 'react-native';
import { router, useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import axiosInstance from '@/utils/axiosInstance'; // Assuming this path is correct
import LoadingScreen from '@/components/LoadingScreen'; // Assuming this path is correct
import { AuthContext } from '@/context/AuthContext'; // Assuming this path is correct
import axios from 'axios';

const OrderDetails = () => {
    const { userInfo, sendPushNotification } = useContext(AuthContext);
    const { orderId } = useLocalSearchParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [deliveryCode, setDeliveryCode] = useState('');
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');

    const navigationRouter = useRouter(); // Renamed to avoid conflict with expo-router's 'router'

    // Function to show custom alert modals
    const showAlert = (type, message) => {
        setModalMessage(message);
        if (type === 'success') {
            setShowSuccessModal(true);
        } else if (type === 'error') {
            setShowErrorModal(true);
        } else if (type === 'confirm') {
            setShowConfirmationModal(true);
        }
    };

    // Function to close all custom alert modals
    const closeAlerts = () => {
        setShowSuccessModal(false);
        setShowErrorModal(false);
        setShowConfirmationModal(false);
        setModalMessage('');
    };

    // Function to handle the "Mark as Delivered" button press
    const handleCompleteDelivery = async () => {
        if (deliveryCode.length === 4) {
            showAlert('confirm', 'Are you sure you want to mark this order as delivered?');
        } else {
            showAlert('error', 'Please enter a valid 4-digit delivery code.');
        }
    };

    // Function to confirm delivery after user confirms in modal
    const confirmDelivery = async () => {
        closeAlerts(); // Close confirmation modal
        setLoading(true);
        try {
            const response = await axiosInstance.post(
                `/runner/${userInfo?._id}/order/${orderId}/delivered`,
                { deliveryCode },
            );

            if (response.status === 200) {
                showAlert('success', 'Delivery marked as complete!');
                await sendPushNotification(
                    order?.customerInfo?.expoPushToken,
                    'Order delivered',
                    'Your order has been completed successfully!',
                );
                // Optionally update local order status or refetch
                setOrder(prev => ({ ...prev, status: 'completed' }));
                setTimeout(() => {
                    closeAlerts();
                    navigationRouter.back(); // Use the renamed router instance
                }, 1500); // Give user time to see success message
            } else {
                showAlert('error', response.data?.message || 'Delivery code is incorrect.');
            }
        } catch (err) {
            console.error('Error completing delivery:', err);
            showAlert('error', err.response?.data?.message || 'Failed to complete delivery. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Fetch order details on component mount or orderId change
    useEffect(() => {
        const fetchOrder = async () => {
            setLoading(true);
            try {
                const response = await axiosInstance.get(`/orders/${orderId}`);
                setOrder(response.data);
            } catch (err) {
                console.error('Error fetching order details:', err);
                showAlert('error', 'Failed to load order details. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        if (orderId) {
            fetchOrder();
        }
    }, [orderId]); // Depend on orderId to refetch if it changes

	// Helper function to remove the +234 prefix if it exists
    const formatContactNumberForWhatsApp = (contactNumber) => {
        if (!contactNumber) return '';
        // Check if the number starts with '+234' and remove it
        if (contactNumber.startsWith('+234')) {
            return contactNumber.substring(1); // Remove the '+' as well
        }
        return contactNumber;
    };

    // Function to handle marking order as picked up (previously "Pay Restaurant")
    const handleMarkAsPickedUp = useCallback(() => {
        setLoading(true);
        // Simulate payment processing / order pickup confirmation
        setTimeout(async () => {
            setLoading(false);
            showAlert('success', 'Order marked as picked up!');
            // Update order status locally if needed
            setOrder(prev => ({ ...prev, status: 'picked up' }));

			const formattedContact = formatContactNumberForWhatsApp(order?.customerInfo?.contact);

            // Send WhatsApp message
            if (formattedContact) {
                const whatsappRes = await axios.post(
                    `https://graph.facebook.com/v22.0/432799279914651/messages`,
                    {
                        messaging_product: 'whatsapp',
                        to: formattedContact, // Use the formatted contact number
                        text: {
                            body: `Your runner is on the way. Use the code, ${order?.deliveryCode} to receive your order.`,
                        }
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            // IMPORTANT: Replace with your actual secure token retrieval method
                            'Authorization': `Bearer EAAGh8yfZCOUgBO3XpjsY0xJVojZAcwwettOgUrOTqPBun2Y4OKUtb5KctwoZA1TlQ894H1xxI4pP9DINZBa6xut1HdlQaMBDVP5LBCrw0BMeZBJ6rugQ4gcZBXAscDbu5cIm3TpoNBXdrJLjRrNLZACT9EV8AFBLnmKotvRQ7FNmOvZBHkf6LzfBD4n3hxXvxteeNQZDZD`,
                        }
                    }
                );
                console.log('WhatsApp message sent response:', whatsappRes.data);
            }
            
            setTimeout(closeAlerts, 1500); // Close success modal after a delay
        }, 2000); // Simulates a 2-second loading time
    }, [order, sendPushNotification]); // Dependencies for useCallback

    const handleChatToggle = useCallback(() => {
        setShowChat(prev => !prev);
    }, []);

    const handleSendMessage = useCallback(() => {
        if (newMessage.trim()) {
            // Add the user's message to the chat
            setChatMessages((prevMessages) => [
                ...prevMessages,
                { text: newMessage.trim(), sender: 'user', timestamp: new Date().toLocaleTimeString() },
            ]);
            setNewMessage('');

            // Simulate a response from the customer
            setTimeout(() => {
                setChatMessages((prevMessages) => [
                    ...prevMessages,
                    {
                        text: 'Thank you for your message!',
                        sender: 'customer',
                        timestamp: new Date().toLocaleTimeString(),
                    },
                ]);
            }, 2000); // Simulates a delay for customer response
        }
    }, [newMessage]);

    const handleCallCustomer = useCallback(() => {
        if (order?.customerInfo?.contact) {
            Linking.openURL(`tel:${order.customerInfo.contact}`).catch((err) =>
                console.error('Failed to make a call:', err)
            );
        } else {
            showAlert('error', 'Customer contact number is not available.');
        }
    }, [order]);

    if (loading && !order) { // Show full screen loader only if order is not yet loaded
        return <LoadingScreen />;
    }

    if (!order) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.headerContainer}>
                    <TouchableOpacity onPress={() => navigationRouter.back()}>
                        <Ionicons name="chevron-back" size={28} color="black" />
                    </TouchableOpacity>
                    <Text style={styles.header}>Order Details</Text>
                </View>
                <View style={styles.emptyStateContainer}>
                    <Text style={styles.emptyStateText}>Order not found or an error occurred.</Text>
                    <Text style={styles.emptyStateSubText}>Please go back and try again.</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Determine if the order is 'in progress' for button visibility
    const isInProgress = order.status === 'in progress';
    const isPickedUp = order.status === 'picked up';
    const isCompleted = order.status === 'completed';

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container}>
                {/* Header */}
                <View style={styles.headerContainer}>
                    <TouchableOpacity onPress={() => navigationRouter.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.header}>
                        Order #{order.orderNumber}
                    </Text>
                    <View style={[styles.statusBadge, getStatusBadgeStyle(order.status)]}>
                        <Text style={[styles.statusText, getStatusTextStyle(order.status)]}>
                            {order.status.toUpperCase()}
                        </Text>
                    </View>
                </View>

                {/* Order Information Cards */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Pickup Location</Text>
                    <Text style={styles.detailTextBold}>{order?.storeId?.name || 'N/A'}</Text>
                    <Text style={styles.detailText}>{order?.storeId?.address || 'No address provided.'}</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Drop-off Location</Text>
                    <Text style={styles.detailTextBold}>{order?.customerInfo?.address || 'N/A'}</Text>
                    <Text style={styles.detailText}>Customer: {order?.customerInfo?.name || 'N/A'}</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Ordered Items</Text>
                    {order.items.length > 0 ? (
                        order.items.map((item, index) => (
                            <View style={styles.itemRow} key={index}>
                                <View style={styles.itemDetails}>
                                    <Text style={styles.itemName}>
                                        {item.name} (x{item.quantity})
                                    </Text>
                                    {item?.variants?.length > 0 && (
                                        <View style={styles.subItemContainer}>
                                            {item.variants.map((variant, vIndex) => (
                                                <Text style={styles.subItemText} key={vIndex}>
                                                    - {variant.name} (x{variant.quantity})
                                                </Text>
                                            ))}
                                        </View>
                                    )}
                                    {item?.addOns?.length > 0 && (
                                        <View style={styles.subItemContainer}>
                                            {item.addOns.map((addOn, aIndex) => (
                                                <Text style={styles.subItemText} key={aIndex}>
                                                    + {addOn.name} (x{addOn.quantity})
                                                </Text>
                                            ))}
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.itemPrice}></Text>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.detailText}>No items listed for this order.</Text>
                    )}
                    <View style={styles.totalPriceContainer}>
                        <Text style={styles.totalPriceLabel}>Delivery Amount:</Text>
                        <Text style={styles.totalPriceValue}>₦{order?.runnerInfo?.price || '0.00'}</Text>
                    </View>
                </View>

                {/* Action Buttons */}
                {!isCompleted && (
                    <View style={styles.actionButtonContainer}>
                        {isInProgress && (
                            <TouchableOpacity
                                style={styles.primaryActionButton}
                                onPress={handleMarkAsPickedUp}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#121212" />
                                ) : (
                                    <Text style={styles.primaryActionButtonText}>
                                        Mark as Picked Up
                                    </Text>
                                )}
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={styles.secondaryActionButton}
                            onPress={handleChatToggle}
                        >
                            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#333" />
                            <Text style={styles.secondaryActionButtonText}>
                                Chat with Customer
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.secondaryActionButton}
                            onPress={handleCallCustomer}
                        >
                            <Ionicons name="call-outline" size={20} color="#333" />
                            <Text style={styles.secondaryActionButtonText}>
                                Call Customer
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Complete Delivery Section */}
                {isPickedUp && ( // Only show if order is picked up
                    <View style={styles.deliveryCompletionSection}>
                        <Text style={styles.sectionTitle}>Complete Delivery</Text>
                        <Text style={styles.sectionDescription}>
                            Enter the 4-digit PIN from the customer to mark the order as delivered.
                        </Text>
                        <TextInput
                            style={styles.deliveryCodeInput}
                            value={deliveryCode}
                            onChangeText={setDeliveryCode}
                            keyboardType="numeric"
                            maxLength={4}
                            placeholder="Enter 4-digit PIN"
                            placeholderTextColor="#999"
                        />
                        <TouchableOpacity
                            style={[
                                styles.completeDeliveryButton,
                                deliveryCode.length !== 4 && styles.disabledButton,
                            ]}
                            onPress={handleCompleteDelivery}
                            disabled={deliveryCode.length !== 4 || loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.completeDeliveryButtonText}>
                                    Mark as Delivered
                                </Text>
                            )}
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
                    <View style={styles.modalOverlay}>
                        <KeyboardAvoidingView
                            style={styles.chatModalContainer}
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0} // Adjust as needed
                        >
                            <View style={styles.chatHeader}>
                                <Text style={styles.chatHeaderText}>Customer Chat</Text>
                                <TouchableOpacity onPress={handleChatToggle} style={styles.chatCloseButton}>
                                    <Ionicons name="close" size={28} color="#333" />
                                </TouchableOpacity>
                            </View>
                            <FlatList
                                data={chatMessages}
                                keyExtractor={(item, index) => index.toString()}
                                renderItem={({ item }) => (
                                    <View
                                        style={[
                                            styles.messageBubble,
                                            item.sender === 'user'
                                                ? styles.userMessageBubble
                                                : styles.customerMessageBubble,
                                        ]}
                                    >
                                        <Text style={styles.messageBubbleText}>
                                            {item.text}
                                        </Text>
                                        <Text style={styles.messageTimestamp}>
                                            {item.timestamp}
                                        </Text>
                                    </View>
                                )}
                                contentContainerStyle={styles.chatMessagesContainer}
                                inverted={false} // Display new messages at the bottom
                            />

                            <View style={styles.chatInputContainer}>
                                <TouchableOpacity
                                    style={styles.chatCallButton}
                                    onPress={handleCallCustomer}
                                >
                                    <Ionicons name="call" size={24} color="#6200ee" />
                                </TouchableOpacity>
                                <TextInput
                                    style={styles.chatTextInput}
                                    placeholder="Type your message..."
                                    value={newMessage}
                                    onChangeText={setNewMessage}
                                    onSubmitEditing={handleSendMessage}
                                    returnKeyType="send"
                                />
                                <TouchableOpacity
                                    style={styles.chatSendButton}
                                    onPress={handleSendMessage}
                                    disabled={!newMessage.trim()}
                                >
                                    <Ionicons
                                        name="send"
                                        size={24}
                                        color={newMessage.trim() ? '#fff' : '#ccc'}
                                    />
                                </TouchableOpacity>
                            </View>
                        </KeyboardAvoidingView>
                    </View>
                </Modal>

                {/* Custom Success Modal */}
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={showSuccessModal}
                    onRequestClose={closeAlerts}
                >
                    <View style={styles.centeredView}>
                        <View style={styles.modalView}>
                            <Ionicons name="checkmark-circle-outline" size={60} color="#4CAF50" />
                            <Text style={styles.modalTitle}>Success!</Text>
                            <Text style={styles.modalBodyText}>{modalMessage}</Text>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonSuccess]}
                                onPress={closeAlerts}
                            >
                                <Text style={styles.modalButtonText}>OK</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Custom Error Modal */}
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={showErrorModal}
                    onRequestClose={closeAlerts}
                >
                    <View style={styles.centeredView}>
                        <View style={styles.modalView}>
                            <Ionicons name="close-circle-outline" size={60} color="#F44336" />
                            <Text style={styles.modalTitle}>Error!</Text>
                            <Text style={styles.modalBodyText}>{modalMessage}</Text>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonError]}
                                onPress={closeAlerts}
                            >
                                <Text style={styles.modalButtonText}>Dismiss</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Custom Confirmation Modal */}
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={showConfirmationModal}
                    onRequestClose={closeAlerts}
                >
                    <View style={styles.centeredView}>
                        <View style={styles.modalView}>
                            <Ionicons name="information-circle-outline" size={60} color="#FFC107" />
                            <Text style={styles.modalTitle}>Confirm Action</Text>
                            <Text style={styles.modalBodyText}>{modalMessage}</Text>
                            <View style={styles.modalButtonContainer}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.modalButtonCancel]}
                                    onPress={closeAlerts}
                                >
                                    <Text style={styles.modalButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.modalButtonConfirm]}
                                    onPress={confirmDelivery}
                                >
                                    <Text style={styles.modalButtonText}>Confirm</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Full-screen Loading Indicator (for operations like API calls) */}
                {loading && order && ( // Only show if order is loaded and an action is pending
                    <View style={styles.overlayLoadingContainer}>
                        <ActivityIndicator size="large" color="#000" />
                        <Text style={styles.overlayLoadingText}>Processing...</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

// Helper function to get status badge style
const getStatusBadgeStyle = (status) => {
    switch (status) {
        case 'in progress':
            return styles.statusBadgeInProgress;
        case 'picked up':
            return styles.statusBadgePickedUp;
        case 'completed':
            return styles.statusBadgeCompleted;
        default:
            return styles.statusBadgeDefault;
    }
};

// Helper function to get status text style
const getStatusTextStyle = (status) => {
    switch (status) {
        case 'in progress':
            return styles.statusTextInProgress;
        case 'picked up':
            return styles.statusTextPickedUp;
        case 'completed':
            return styles.statusTextCompleted;
        default:
            return styles.statusTextDefault;
    }
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFF', // Light grey background
    },
    container: {
        flex: 1,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? 30 : 0, // Adjust for Android status bar
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    backButton: {
        paddingRight: 10,
    },
    header: {
        flex: 1, // Take remaining space
        fontSize: 22,
        fontWeight: '700', // Bold
        color: '#121212',
    },
    statusBadge: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 15,
        marginLeft: 10,
        alignSelf: 'flex-start',
    },
    statusBadgeInProgress: {
        backgroundColor: '#FFF8E1', // Light yellow
        borderWidth: 1,
        borderColor: '#F5DD4B', // Yellow
    },
    statusBadgePickedUp: {
        backgroundColor: '#E0F2F7', // Light blue
        borderWidth: 1,
        borderColor: '#2196F3', // Blue
    },
    statusBadgeCompleted: {
        backgroundColor: '#E8F5E9', // Light green
        borderWidth: 1,
        borderColor: '#4CAF50', // Green
    },
    statusBadgeDefault: {
        backgroundColor: '#E0E0E0',
        borderWidth: 1,
        borderColor: '#B0B0B0',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    statusTextInProgress: {
        color: '#F5DD4B',
    },
    statusTextPickedUp: {
        color: '#2196F3',
    },
    statusTextCompleted: {
        color: '#4CAF50',
    },
    statusTextDefault: {
        color: '#4A4A4A',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginTop: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666666',
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
        paddingBottom: 8,
    },
    detailText: {
        fontSize: 15,
        color: '#4A4A4A',
        marginBottom: 4,
    },
    detailTextBold: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333333',
        marginBottom: 4,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    itemDetails: {
        flex: 1,
        marginRight: 10,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#121212',
    },
    subItemContainer: {
        marginLeft: 10,
        marginTop: 2,
    },
    subItemText: {
        fontSize: 13,
        color: '#666666',
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333333',
    },
    totalPriceContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 15,
        marginTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
    },
    totalPriceLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333333',
    },
    totalPriceValue: {
        fontSize: 22,
        fontWeight: '800',
        color: '#27D367', // Green for total
    },
    actionButtonContainer: {
        paddingHorizontal: 16,
        marginTop: 20,
        marginBottom: 10,
    },
    primaryActionButton: {
        backgroundColor: '#27D367', // Green for primary action
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    primaryActionButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    secondaryActionButton: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    secondaryActionButtonText: {
        color: '#333333',
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 8,
    },
    deliveryCompletionSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginTop: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#121212',
        marginBottom: 8,
    },
    sectionDescription: {
        fontSize: 14,
        color: '#666666',
        marginBottom: 15,
    },
    deliveryCodeInput: {
        height: 50,
        borderColor: '#E0E0E0',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        fontSize: 18,
        textAlign: 'center',
        letterSpacing: 5, // Space out digits
        marginBottom: 20,
        backgroundColor: '#F9F9F9',
    },
    completeDeliveryButton: {
        backgroundColor: '#007BFF', // Blue for completion
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    completeDeliveryButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    disabledButton: {
        backgroundColor: '#B0BEC5', // Grey for disabled state
        shadowOpacity: 0,
        elevation: 0,
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        height: 300, // Give it some height
        paddingHorizontal: 20,
    },
    emptyStateText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#666',
        textAlign: 'center',
        marginBottom: 8,
    },
    emptyStateSubText: {
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
    },

    // Chat Modal Styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.6)', // Darker overlay
    },
    chatModalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 10,
        height: '75%', // Increased height for better chat experience
        overflow: 'hidden', // Ensure content doesn't spill
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    chatHeaderText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#121212',
    },
    chatCloseButton: {
        padding: 5,
    },
    chatMessagesContainer: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        flexGrow: 1, // Allows FlatList to grow
        justifyContent: 'flex-end', // Stick messages to the bottom
    },
    messageBubble: {
        padding: 12,
        borderRadius: 18, // More rounded bubbles
        marginVertical: 6,
        maxWidth: '80%',
        shadowColor: '#000', // Subtle shadow for bubbles
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    userMessageBubble: {
        backgroundColor: '#DCF8C6', // Light green for user
        alignSelf: 'flex-end',
        borderBottomRightRadius: 5, // Pointed corner
    },
    customerMessageBubble: {
        backgroundColor: '#E0E0E0', // Light grey for customer
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 5, // Pointed corner
    },
    messageBubbleText: {
        fontSize: 16,
        color: '#333',
    },
    messageTimestamp: {
        fontSize: 10,
        color: '#888',
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    chatInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        backgroundColor: '#fff',
    },
    chatCallButton: {
        backgroundColor: '#F0F0F0',
        padding: 10,
        borderRadius: 25,
        marginRight: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    chatTextInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 25,
        paddingHorizontal: 15,
        paddingVertical: 10,
        fontSize: 16,
        backgroundColor: '#F9F9F9',
    },
    chatSendButton: {
        backgroundColor: '#27D367', // Green send button
        padding: 10,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },

    // Custom Alert Modal Styles
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.4)', // Semi-transparent background
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '80%', // Make modal a bit wider
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
        textAlign: 'center',
    },
    modalBodyText: {
        marginBottom: 20,
        textAlign: 'center',
        fontSize: 16,
        color: '#555',
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    modalButton: {
        borderRadius: 10,
        padding: 12,
        elevation: 2,
        minWidth: 100,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    modalButtonSuccess: {
        backgroundColor: '#4CAF50', // Green
    },
    modalButtonError: {
        backgroundColor: '#F44336', // Red
    },
    modalButtonConfirm: {
        backgroundColor: '#007BFF', // Blue
    },
    modalButtonCancel: {
        backgroundColor: '#E0E0E0', // Light grey
        borderWidth: 1,
        borderColor: '#CCC',
    },
    modalButtonText: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 16,
    },
    // Override text color for cancel button
    modalButtonCancelText: {
        color: '#555',
    },

    // Overlay Loading Indicator
    overlayLoadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.7)', // Semi-transparent white
        zIndex: 1000, // Ensure it's on top
        borderRadius: 12, // Match card styles
    },
    overlayLoadingText: {
        marginTop: 15,
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
});

export default OrderDetails;
