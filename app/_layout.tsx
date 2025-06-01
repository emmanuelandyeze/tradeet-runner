import { Slot, Stack } from 'expo-router';
import { View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/context/AuthContext';
import { SocketProvider } from '@/context/SocketContext';

// Import your global CSS file
import '@/global.css';

export default function Layout() {
	return (
		<AuthProvider>
			<SocketProvider>
				<Slot />
				<StatusBar
					backgroundColor="#fff"
					style="dark"
					translucent={true}
				/>
			</SocketProvider>
		</AuthProvider>
	);
}
