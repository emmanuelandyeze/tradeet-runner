import { Tabs } from 'expo-router';
import React, { useState } from 'react';

import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import LoadingScreen from '@/components/LoadingScreen';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [loading, setLoading] = useState(false);

	if (loading) return <LoadingScreen />;

  return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor:
					Colors[colorScheme ?? 'light'].tint,
				headerShown: false,
				tabBarShowLabel: true,
				tabBarStyle: {
					paddingBottom: 20,
					height: 90,
					paddingTop: 10,
				},
				tabBarLabelStyle: { fontSize: 14, marginTop: 10 },
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: 'Orders',
					tabBarIcon: ({ color, focused }) => (
						<TabBarIcon
							name={
								focused ? 'clipboard' : 'clipboard-outline'
							}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="wallet"
				options={{
					title: 'Wallet',
					tabBarIcon: ({ color, focused }) => (
						<TabBarIcon
							name={focused ? 'wallet' : 'wallet-outline'}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="support"
				options={{
					title: 'Support',
					tabBarIcon: ({ color, focused }) => (
						<TabBarIcon
							name={
								focused
									? 'chatbubble-ellipses'
									: 'chatbubble-ellipses-outline'
							}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="profile"
				options={{
					title: 'Profile',
					tabBarIcon: ({ color, focused }) => (
						<TabBarIcon
							name={
								focused
									? 'person-circle'
									: 'person-circle-outline'
							}
							color={color}
						/>
					),
				}}
			/>
		</Tabs>
	);
}
