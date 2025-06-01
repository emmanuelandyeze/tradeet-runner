import axios from 'axios';

const axiosInstance = axios.create({
	baseURL: 'http://192.168.247.140:5000', // or use your deployed server URL
	headers: {
		'Content-Type': 'application/json',
	},
});

export default axiosInstance;
