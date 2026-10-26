// Centralized API and Backend URL configuration loaded from .env
const rawBackendUrl = import.meta.env.VITE_BACKEND_URL || 'https://book-my-ticket-3brf.onrender.com';
export const BACKEND_URL = rawBackendUrl.replace(/\/+$/, '');

const rawApiUrl = import.meta.env.VITE_API_URL || `${BACKEND_URL}/api`;
export const API_BASE_URL = rawApiUrl.replace(/\/+$/, '');

export default API_BASE_URL;
