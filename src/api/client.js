import axios from 'axios';

const client = axios.create({
    // baseURL: import.meta.env.VITE_API_URL || 'https://traffic-analysis-backend-9vjd.onrender.com',
    baseURL: 'http://localhost:8000',
});

export default client;
