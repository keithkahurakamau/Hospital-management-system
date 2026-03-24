import React, { useState } from 'react';
import { Activity, Lock, Mail, Eye, EyeOff, Loader2 } from 'lucide-react';
import api from '../api/axiosConfig'; 

const Login = ({ onLoginSuccess }) => {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
        setError(''); 
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await api.post('/auth/login', {
                email: credentials.email,
                password: credentials.password
            });

            // --- THE CRITICAL FIX ---
            // Destructure both the token and the user object from the response
            const { token, user: userData } = response.data;

            // Save the JWT to localStorage. Axios interceptor uses the key 'token'.
            localStorage.setItem('token', token); 
            localStorage.setItem('userRole', userData.role);
            localStorage.setItem('userName', userData.name);
            
            onLoginSuccess();
            
        } catch (err) {
            const errorMessage = err.response?.data?.detail || 'Invalid credentials or system unreachable.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                
                {/* Brand Header */}
                <div className="bg-[#1B2559] p-8 text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm border border-white/20">
                        <Activity size={32} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-wide">Medicare ERP</h1>
                    <p className="text-blue-200 text-sm mt-2 font-medium">Hospital Management System V3</p>
                </div>

                <div className="p-8">
                    <h2 className="text-xl font-bold text-[#1B2559] mb-6 text-center">Secure Login</h2>

                    {error && (
                        <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-xl text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-2 ml-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
                                <input 
                                    type="email" 
                                    name="email"
                                    required
                                    value={credentials.email}
                                    onChange={handleChange}
                                    placeholder="Enter your email" 
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-2 ml-1">Password</label>
                            <div className="relative">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    name="password"
                                    required
                                    value={credentials.password}
                                    onChange={handleChange}
                                    placeholder="Enter your password" 
                                    className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-3.5 text-slate-400 hover:text-blue-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 hover:shadow-lg transition-all flex justify-center items-center gap-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" /> Authenticating...
                                </>
                            ) : (
                                'Access System'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;