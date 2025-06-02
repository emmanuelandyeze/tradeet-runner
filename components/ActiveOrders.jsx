import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView, // Added for better layout on different devices
} from 'react-native';
// Assuming expo-router is set up in the user's environment
import { router } from 'expo-router'; 

// You might use a library like 'react-native-vector-icons' for actual icons.
// For this example, we'll use simple text-based indicators or emojis.
// import { MaterialCommunityIcons } from '@expo/vector-icons'; 

const ActiveOrders = ({ onCountChange, orders }) => {
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [filter, setFilter] = useState('in progress');

    // Effect to update the count of active orders and filter them
    useEffect(() => {
        // Ensure orders is an array before filtering
        const currentOrders = Array.isArray(orders) ? orders : [];
        
        // Update the count of all orders (or just 'in progress' if that's the desired metric)
        onCountChange(currentOrders.length); 

        // Filter orders based on the current filter state
        if (filter === 'in progress') {
            setFilteredOrders(currentOrders.filter((order) => order.status === 'in progress'));
        } else if (filter === 'completed') {
            setFilteredOrders(currentOrders.filter((order) => order.status === 'completed'));
        } else {
            // Fallback for any other filter, though we only have two
            setFilteredOrders(currentOrders);
        }
    }, [orders, filter, onCountChange]); // Added onCountChange to dependencies

    // Helper function to get status badge style
    const getStatusBadgeStyle = (status) => {
        switch (status) {
            case 'in progress':
                return styles.statusBadgeInProgress;
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
            case 'completed':
                return styles.statusTextCompleted;
            default:
                return styles.statusTextDefault;
        }
    };

    // Renders each individual order item in the FlatList
    const renderOrder = ({ item }) => (
        <TouchableOpacity
            style={styles.orderCard}
            onPress={() => {
                // Navigate to the order details screen
                if (router && item._id) {
                    router.push(`/orders/${item._id}`);
                } else {
                    console.warn('Router not available or order ID missing.');
                }
            }}
            activeOpacity={0.7} // Visual feedback on press
        >
            <View style={styles.cardContent}>
                {/* Store Information */}
                <Text style={styles.storeName}>
                    {item?.storeId?.name || 'Unknown Store'}
                </Text>
                <Text style={styles.storeAddress}>
                    {item?.storeId?.address || 'No Store Address'}
                </Text>

                {/* Drop-off Information - Highlighted */}
                <View style={styles.dropOffContainer}>
                    {/* You could use an icon here, e.g., <MaterialCommunityIcons name="map-marker-outline" size={16} color="#4A4A4A" /> */}
                    <Text style={styles.dropOffLabel}>Drop-off:</Text>
                    <Text style={styles.dropOffAddress}>
                        {item?.customerInfo?.address || 'No Drop-off Address'}
                    </Text>
                </View>

                {/* Status Badge */}
                <View style={[styles.statusBadge, getStatusBadgeStyle(item.status)]}>
                    <Text style={[styles.statusText, getStatusTextStyle(item.status)]}>
                        {item.status.toUpperCase()}
                    </Text>
                </View>
            </View>

            {/* Navigation Arrow */}
            <View style={styles.arrowContainer}>
                {/* You could use an icon here, e.g., <MaterialCommunityIcons name="chevron-right" size={24} color="#B0B0B0" /> */}
                <Text style={styles.arrowIcon}>›</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Filter buttons - now part of a fixed header for better UX */}
                <View style={styles.filterContainer}>
                    <TouchableOpacity
                        style={[
                            styles.filterButton,
                            filter === 'in progress' && styles.activeFilterButton,
                        ]}
                        onPress={() => setFilter('in progress')}
                        activeOpacity={0.7}
                    >
                        <Text style={[
                            styles.filterText,
                            filter === 'in progress' && styles.activeFilterText,
                        ]}>In Progress</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.filterButton,
                            filter === 'completed' && styles.activeFilterButton,
                        ]}
                        onPress={() => setFilter('completed')}
                        activeOpacity={0.7}
                    >
                        <Text style={[
                            styles.filterText,
                            filter === 'completed' && styles.activeFilterText,
                        ]}>Completed</Text>
                    </TouchableOpacity>
                </View>

                {/* List of Orders */}
                <FlatList
                    data={filteredOrders}
                    keyExtractor={(item) => item._id}
                    renderItem={renderOrder}
                    contentContainerStyle={styles.listContentContainer} // Added for better spacing
                    ListEmptyComponent={
                        <View style={styles.emptyListContainer}>
                            {/* You could use an emoji or icon here */}
                            <Text style={styles.emptyListIcon}>📦</Text>
                            <Text style={styles.emptyListText}>
                                No {filter} orders at the moment.
                            </Text>
                            <Text style={styles.emptyListSubText}>
                                Check back later for new deliveries!
                            </Text>
                        </View>
                    }
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F5F5F5', // Light grey background for the entire screen
    },
    container: {
        flex: 1,
        paddingHorizontal: 16, // Consistent horizontal padding
        paddingTop: 16, // Padding from the top for the filter buttons
    },
    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'center', // Center the filter buttons
        marginBottom: 20, // Space below filter buttons
        backgroundColor: '#FFFFFF', // White background for the filter bar
        borderRadius: 25, // Rounded corners for the filter bar container
        padding: 4, // Inner padding for the segmented control look
        shadowColor: '#000', // Subtle shadow for depth
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
		gap: 8, // Space between buttons
    },
    filterButton: {
        flex: 1, // Distribute space evenly
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20, // More rounded buttons
        backgroundColor: '#E0E0E0', // Default button background
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeFilterButton: {
        backgroundColor: '#F5DD4B', // Vibrant yellow for active state
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 2,
    },
    filterText: {
        color: '#4A4A4A', // Darker grey for inactive text
        fontSize: 14,
        fontWeight: '500', // Medium weight
    },
    activeFilterText: {
        color: '#121212', // Darker text for active state
        fontWeight: '600', // Semi-bold for active text
    },
    listContentContainer: {
        paddingBottom: 20, // Ensure content doesn't get cut off at the bottom
    },
    orderCard: {
        flexDirection: 'row', // Arrange content and arrow side-by-side
        backgroundColor: '#FFFFFF', // White background for cards
        borderRadius: 12, // More rounded corners for cards
        padding: 16,
        marginBottom: 12, // Space between cards
        shadowColor: '#000', // Enhanced shadow for better depth
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 5,
        alignItems: 'center', // Vertically align items in the card
    },
    cardContent: {
        flex: 1, // Takes up available space
    },
    storeName: {
        fontSize: 18,
        fontWeight: '700', // Bold
        color: '#121212',
        marginBottom: 4,
    },
    storeAddress: {
        fontSize: 14,
        color: '#666666', // Slightly lighter grey
        marginBottom: 8,
    },
    dropOffContainer: {
        flexDirection: 'row', // Align label and address
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    dropOffLabel: {
        fontSize: 14,
        color: '#4A4A4A',
        marginRight: 4,
    },
    dropOffAddress: {
        fontSize: 16,
        fontWeight: '700', // Bold and prominent
        color: '#333333', // Darker for emphasis
        flexShrink: 1, // Allow text to wrap
    },
    statusBadge: {
        alignSelf: 'flex-start', // Align badge to the left
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 15, // Pill-shaped badge
        marginTop: 8,
    },
    statusBadgeInProgress: {
        backgroundColor: '#FFF8E1', // Light yellow background
        borderWidth: 1,
        borderColor: '#F5DD4B', // Yellow border
    },
    statusBadgeCompleted: {
        backgroundColor: '#E8F5E9', // Light green background
        borderWidth: 1,
        borderColor: '#4CAF50', // Green border
    },
    statusBadgeDefault: {
        backgroundColor: '#E0E0E0',
        borderWidth: 1,
        borderColor: '#B0B0B0',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600', // Semi-bold
        textTransform: 'uppercase', // All caps
    },
    statusTextInProgress: {
        color: '#F5DD4B', // Yellow text
    },
    statusTextCompleted: {
        color: '#4CAF50', // Green text
    },
    statusTextDefault: {
        color: '#4A4A4A',
    },
    arrowContainer: {
        paddingLeft: 10, // Space between content and arrow
    },
    arrowIcon: {
        fontSize: 24, // Larger arrow
        color: '#B0B0B0', // Light grey arrow
    },
    emptyListContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        height: 400, // Give it some height for centering
        paddingHorizontal: 20,
    },
    emptyListIcon: {
        fontSize: 60, // Large emoji/icon
        marginBottom: 20,
    },
    emptyListText: {
        textAlign: 'center',
        fontSize: 20,
        fontWeight: '600',
        color: '#666666',
        marginBottom: 8,
    },
    emptyListSubText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#888888',
    },
});

export default ActiveOrders;
