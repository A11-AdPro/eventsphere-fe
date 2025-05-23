export const API_CONFIG = {
    BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
    USE_MOCK_API: process.env.NEXT_PUBLIC_USE_MOCK === 'true',
};

export const API_ROUTES = {
    BASE: API_CONFIG.BASE_URL,
    AUTH: {
        LOGIN: `${API_CONFIG.BASE_URL}/api/auth/login`,
        REGISTER: `${API_CONFIG.BASE_URL}/api/auth/register`,
        ME: `${API_CONFIG.BASE_URL}/api/auth/me`,
    },
    ADMIN: {
        USERS: `${API_CONFIG.BASE_URL}/api/admin/users`,
    },
    REPORTS: {
        BASE: `${API_CONFIG.BASE_URL}/api/attendee/reports`,
        ADMIN: `${API_CONFIG.BASE_URL}/api/admin/reports`,
        ORGANIZER: `${API_CONFIG.BASE_URL}/api/organizer/reports`,
    },
    NOTIFICATIONS: {
        BASE: `${API_CONFIG.BASE_URL}/api/notifications`,
    }
};

// Export for backward compatibility
export const USE_MOCK_API = API_CONFIG.USE_MOCK_API;

// Export environment variables that are actually needed
export const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL;
export const NEXT_PUBLIC_USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK;