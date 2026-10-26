// Centralized API and Backend URL configuration loaded from .env
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
export const API_BASE_URL = import.meta.env.VITE_API_URL || `${BACKEND_URL}/api`;

export default API_BASE_URL;
