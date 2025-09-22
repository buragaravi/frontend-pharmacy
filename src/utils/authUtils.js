/**
 * Authentication Utilities
 * Handles secure storage and retrieval of user credentials
 */

// Storage keys
const STORAGE_KEYS = {
    REMEMBER_ME_CREDENTIALS: 'rememberMeCredentials',
    SESSION_CREDENTIALS: 'sessionCredentials',
    TOKEN: 'token',
    LAB_ID: 'labId',
    USER: 'user'
};

/**
 * Clear all stored authentication data
 */
export const clearAllStoredCredentials = () => {
    // Clear localStorage
    Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });
    
    // Clear sessionStorage
    Object.values(STORAGE_KEYS).forEach(key => {
        sessionStorage.removeItem(key);
    });
};

/**
 * Store credentials based on remember me preference
 * @param {Object} credentials - { token, user, rememberMe }
 */
export const storeCredentials = (credentials) => {
    const { token, user, rememberMe } = credentials;
    
    // Clear existing credentials first
    clearAllStoredCredentials();
    
    // Prepare credentials object with timestamp
    const credentialsData = {
        token,
        user,
        timestamp: Date.now(),
        rememberMe
    };
    
    if (rememberMe) {
        // Store in localStorage (persistent across browser sessions)
        localStorage.setItem(STORAGE_KEYS.REMEMBER_ME_CREDENTIALS, JSON.stringify(credentialsData));
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.LAB_ID, user.labId || '');
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
        // Store in sessionStorage (session-only, cleared when browser closes)
        sessionStorage.setItem(STORAGE_KEYS.SESSION_CREDENTIALS, JSON.stringify(credentialsData));
        sessionStorage.setItem(STORAGE_KEYS.TOKEN, token);
        sessionStorage.setItem(STORAGE_KEYS.LAB_ID, user.labId || '');
        sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }
};

/**
 * Retrieve stored credentials
 * @returns {Object|null} - Stored credentials or null if not found
 */
export const getStoredCredentials = () => {
    // Check localStorage first (remember me enabled)
    let storedData = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME_CREDENTIALS);
    
    // If not in localStorage, check sessionStorage (remember me disabled)
    if (!storedData) {
        storedData = sessionStorage.getItem(STORAGE_KEYS.SESSION_CREDENTIALS);
    }
    
    if (storedData) {
        try {
            return JSON.parse(storedData);
        } catch (error) {
            console.error('Error parsing stored credentials:', error);
            clearAllStoredCredentials();
            return null;
        }
    }
    
    return null;
};

/**
 * Get current token from storage
 * @returns {string|null} - Current token or null if not found
 */
export const getCurrentToken = () => {
    // Simple approach - just get from localStorage
    return localStorage.getItem('token');
};

/**
 * Get current user from storage
 * @returns {Object|null} - Current user or null if not found
 */
export const getCurrentUser = () => {
    // Check localStorage first
    let userData = localStorage.getItem(STORAGE_KEYS.USER);
    
    // If not in localStorage, check sessionStorage
    if (!userData) {
        userData = sessionStorage.getItem(STORAGE_KEYS.USER);
    }
    
    if (userData) {
        try {
            return JSON.parse(userData);
        } catch (error) {
            console.error('Error parsing stored user data:', error);
            return null;
        }
    }
    
    return null;
};

/**
 * Validate stored credentials with backend
 * @param {string} baseURL - Backend base URL
 * @returns {Promise<Object|null>} - Valid user data or null if invalid
 */
export const validateStoredCredentials = async (baseURL) => {
    const credentials = getStoredCredentials();
    
    if (!credentials) {
        return null;
    }
    
    const { token } = credentials;
    
    try {
        const response = await fetch(`${baseURL}/api/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const userData = await response.json();
            return userData;
        } else {
            // Token is invalid or expired
            clearAllStoredCredentials();
            return null;
        }
    } catch (error) {
        console.error('Error validating stored credentials:', error);
        clearAllStoredCredentials();
        return null;
    }
};

/**
 * Check if user is currently authenticated
 * @returns {boolean} - True if user has valid stored credentials
 */
export const isAuthenticated = () => {
    return getCurrentToken() !== null;
};

/**
 * Get dashboard route based on user role
 * @param {string} role - User role
 * @returns {string} - Dashboard route
 */
export const getDashboardRoute = (role) => {
    switch (role) {
        case 'admin':
            return '/dashboard/admin';
        case 'central_store_admin':
            return '/dashboard/central';
        case 'lab_assistant':
            return '/dashboard/lab';
        case 'faculty':
            return '/dashboard/faculty';
        default:
            return '/login';
    }
};

/**
 * Logout user and clear all stored data
 * @param {Function} navigate - React Router navigate function
 */
export const logoutUser = (navigate) => {
    // Simple logout - just clear localStorage like before
    localStorage.removeItem('token');
    localStorage.removeItem('labId');
    localStorage.removeItem('user');
    
    if (navigate) {
        navigate('/login');
    } else {
        window.location.href = '/login';
    }
};
