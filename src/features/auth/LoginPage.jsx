import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    storeCredentials, 
    getStoredCredentials, 
    clearAllStoredCredentials, 
    validateStoredCredentials, 
    getDashboardRoute 
} from '../../utils/authUtils';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const navigate = useNavigate();

    // Auto-login functionality - check for stored token on component mount
    useEffect(() => {
        const checkStoredToken = async () => {
            try {
                // Simple check - just look for token in localStorage
                const token = localStorage.getItem('token');
                
                if (token) {
                    // Validate token with backend
                    const response = await axios.get('https://backend-pharmacy-5541.onrender.com/api/auth/me', {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    
                    if (response.data) {
                        // Token is valid, auto-login user
                        const dashboardRoute = getDashboardRoute(response.data.role);
                        navigate(dashboardRoute);
                    } else {
                        // Token is invalid, clear stored data
                        localStorage.removeItem('token');
                        localStorage.removeItem('labId');
                        localStorage.removeItem('user');
                    }
                }
                // If no token, stay on login page
            } catch (error) {
                // Token is invalid or expired, clear stored data
                console.log('Auto-login failed:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('labId');
                localStorage.removeItem('user');
            }
        };

        checkStoredToken();
    }, [navigate]);    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        
        try {
            const response = await axios.post('https://backend-pharmacy-5541.onrender.com/api/auth/login', {
                email,
                password,
            });

            const { token, user } = response.data;

            // Simple storage - always store in localStorage like before
            localStorage.setItem('token', token);
            localStorage.setItem('labId', user.labId || '');
            localStorage.setItem('user', JSON.stringify(user));
            
            // Navigate to appropriate dashboard
            const dashboardRoute = getDashboardRoute(user.role);
            if (dashboardRoute === '/login') {
                setError('Unknown user role');
            } else {
                navigate(dashboardRoute);
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Neumorphic Styles */}
            <style>{`
                .neomorphic-card {
                    background: rgba(255, 255, 255, 0.25);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.18);
                    box-shadow: 
                        20px 20px 40px rgba(59, 130, 246, 0.1),
                        -20px -20px 40px rgba(255, 255, 255, 0.8),
                        inset 2px 2px 6px rgba(255, 255, 255, 0.25),
                        inset -2px -2px 6px rgba(59, 130, 246, 0.1);
                }
                
                .neomorphic-input {
                    background: rgba(255, 255, 255, 0.8);
                    border: 1px solid rgba(59, 130, 246, 0.2);
                    box-shadow: 
                        inset 4px 4px 8px rgba(59, 130, 246, 0.1),
                        inset -4px -4px 8px rgba(255, 255, 255, 0.8);
                }
                
                .neomorphic-input:focus {
                    background: rgba(255, 255, 255, 0.9);
                    border-color: rgba(59, 130, 246, 0.4);
                    box-shadow: 
                        inset 4px 4px 8px rgba(59, 130, 246, 0.15),
                        inset -4px -4px 8px rgba(255, 255, 255, 0.9),
                        0 0 0 3px rgba(59, 130, 246, 0.1);
                }
                
                .neomorphic-button {
                    background: linear-gradient(145deg, rgb(255, 255, 255), rgb(219, 234, 254));
                    border: 1px solid rgba(59, 130, 246, 0.3);
                    box-shadow: 
                        8px 8px 16px rgba(59, 130, 246, 0.2),
                        -8px -8px 16px rgba(255, 255, 255, 0.8);
                }
                
                .neomorphic-button:hover {
                    background: linear-gradient(145deg, rgb(239, 246, 255), rgb(255, 255, 255));
                    box-shadow: 
                        6px 6px 12px rgba(59, 130, 246, 0.25),
                        -6px -6px 12px rgba(255, 255, 255, 0.9);
                }
                
                .neomorphic-button:active {
                    box-shadow: 
                        inset 4px 4px 8px rgba(59, 130, 246, 0.2),
                        inset -4px -4px 8px rgba(255, 255, 255, 0.8);
                }
                
                .grid-pattern {
                    background-image: 
                        linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px);
                    background-size: 50px 50px;
                }
                
                .logo-shadow {
                    box-shadow: 
                        12px 12px 24px rgba(59, 130, 246, 0.2),
                        -12px -12px 24px rgba(255, 255, 255, 0.8);
                }
            `}</style>

            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 relative overflow-hidden">
                {/* Subtle Grid Background */}
                <div className="absolute inset-0 grid-pattern opacity-30" />
                
                {/* Subtle Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-transparent to-blue-100/40" />

                {/* Header */}
                <div className="bg-white/80 backdrop-blur-sm border-b border-blue-100/50 p-4 text-center relative">
                    <h1 className="text-2xl font-bold text-blue-700">
                        Laboratory Management System
                    </h1>
                </div>

                {/* Main Content Container */}
                <div className="container mx-auto px-4 py-12 flex flex-col lg:flex-row items-center justify-center min-h-screen relative z-10">
                    {/* Logo Section */}
                    <div className="w-full lg:w-1/3 flex flex-col items-center lg:items-start mb-12 lg:mb-0 lg:pr-12">
                        <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center mb-6 logo-shadow">
                            <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className="h-12 w-12 text-white" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" 
                                />
                            </svg>
                        </div>
                        <h1 className="text-4xl font-bold text-blue-700 text-center lg:text-left mb-2">
                            LabConnect
                        </h1>
                        <p className="text-blue-600/70 text-center lg:text-left text-lg font-medium">
                            Secure Access Portal
                        </p>
                        <p className="text-gray-500 text-center lg:text-left text-sm mt-2 max-w-md">
                            Enter your credentials to access the laboratory management system
                        </p>
                    </div>

                    {/* Login Form Card */}
                    <div className="w-full lg:w-2/3 max-w-md">
                        <div className="neomorphic-card rounded-3xl overflow-hidden">
                            <div className="p-8">
                                <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">
                                    Welcome Back
                                </h2>
                                
                                {isLoading && (
                                    <div className="mb-6 p-4 bg-blue-50 text-blue-700 rounded-2xl text-sm flex items-center border border-blue-100">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Please wait a few seconds...
                                    </div>
                                )}

                                {error && (
                                    <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm flex items-center border border-red-100">
                                        <svg 
                                            xmlns="http://www.w3.org/2000/svg" 
                                            className="h-5 w-5 mr-3 text-red-500" 
                                            fill="none" 
                                            viewBox="0 0 24 24" 
                                            stroke="currentColor"
                                        >
                                            <path 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round" 
                                                strokeWidth={2} 
                                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                                            />
                                        </svg>
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Email Field */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <input
                                                type="email"
                                                placeholder="you@university.edu"
                                                className="neomorphic-input w-full pl-12 pr-4 py-3 rounded-2xl text-gray-700 placeholder-gray-400 transition-all duration-300 focus:outline-none"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Password Field */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                            </div>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                className="neomorphic-input w-full pl-12 pr-12 py-3 rounded-2xl text-gray-700 placeholder-gray-400 transition-all duration-300 focus:outline-none"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-blue-400 hover:text-blue-600 transition-colors"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    {showPassword ? (
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                                    ) : (
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    )}
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Remember Me & Forgot Password */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <input
                                                id="remember-me"
                                                name="remember-me"
                                                type="checkbox"
                                                checked={rememberMe}
                                                onChange={(e) => setRememberMe(e.target.checked)}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-blue-300 rounded"
                                            />
                                            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                                                Remember me
                                            </label>
                                        </div>

                                        <div className="text-sm">
                                            <button
                                                type="button"
                                                className="font-medium text-blue-600 hover:text-blue-500 bg-transparent border-none p-0 m-0 cursor-pointer transition-colors"
                                                onClick={() => navigate('/password-reset')}
                                            >
                                                Forgot password?
                                            </button>
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className={`neomorphic-button w-full flex justify-center py-3 px-6 rounded-2xl text-sm font-medium text-blue-700 transition-all duration-300 ${isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:text-blue-800'}`}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Signing in...
                                                </>
                                            ) : 'Sign In'}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Footer */}
                            <div className="px-8 py-4 bg-white/40 backdrop-blur-sm border-t border-blue-100/50 text-center">
                                <p className="text-sm text-gray-600">
                                    Don't have an account? contact the admin
                                   
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LoginPage;