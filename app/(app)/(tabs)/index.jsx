import React, { useState, useContext } from 'react';
import {
	Image,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
// Adjust the import path as needed
import Header from '@/components/Header';
import TabView from '@/components/TabView';
import NewRequests from '@/components/NewRequests';
import AntDesign from '@expo/vector-icons/AntDesign';
import { StatusBar } from 'expo-status-bar';
import { AuthContext } from '@/context/AuthContext';

export default function HomeScreen() {
	const { logout, userInfo, loading } =
		useContext(AuthContext);
	return (
		<View className="flex-1 w-full bg-white">
			<StatusBar
				backgroundColor="#fff"
				style="dark"
				translucent={true}
			/>
			{/* Header */}
			<View>
				<Header
					profileImage={userInfo?.profileImage}
					campus={userInfo?.campus}
					onSearch={(text) => console.log(text)}
					name={userInfo?.name}
					userInfo={userInfo}
					runnerId={userInfo?._id}
				/>
			</View>
			{!userInfo?.isApproved && (
				<View style={{ backgroundColor: 'red' }}>
					<Text
						style={{
							textAlign: 'center',
							marginVertical: 5,
							justifyContent: 'center',
							color: '#fff'
						}}
					>
						Your profile is currently in review. Please wait for
						approval.
					</Text>
				</View>
			)}

			<TabView />
		</View>
	);
}
