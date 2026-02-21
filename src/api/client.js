import axios from 'axios';

const client = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://traffic-analysis-backend-9vjd.onrender.com',
    headers: {
        'Content-Type': 'application/json',
    },
});

export default client;
