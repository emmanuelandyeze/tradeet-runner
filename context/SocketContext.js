import React, {
	createContext,
	useContext,
	useEffect,
	useState,
} from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from '@/context/AuthContext';

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
	const { userInfo } = useContext(AuthContext);
	const [socket, setSocket] = useState(null);

	useEffect(() => {
		if (userInfo?._id) {
			const newSocket = io('http://192.168.17.140:5000', {
				query: { runnerId: userInfo._id },
			});

			newSocket.on('connect', () => {
				console.log(
					userInfo._id,
					' Connected to server with ID:',
					newSocket.id,
				);
			});

			newSocket.on('disconnect', () => {
				console.log('Disconnected from server');
			});

			setSocket(newSocket);

			// Cleanup on unmount
			return () => {
				newSocket.disconnect();
			};
		}
	}, [userInfo]);

	return (
		<SocketContext.Provider value={socket}>
			{children}
		</SocketContext.Provider>
	);
};

export const useSocket = () => useContext(SocketContext);
