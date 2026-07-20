import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api', // Points directly to our Java Backend
});

export default api;