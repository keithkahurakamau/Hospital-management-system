import React, { useState } from 'react';
import api from '../api/axiosConfig';
import { LogIn, Lock, Mail, AlertCircle, Activity, Loader2, Eye, EyeOff } from 'lucide-react'; // 🚨 Added Eye & EyeOff

const Login = ({ onLoginSuccess }) => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // 🚨 NEW TOGGLE STATE 🚨
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault(); 
        setError(null);
        setIsLoading(true);

        try {
            const res = await api.post('/auth/login', formData);
            
            // 🚨 SECURITY UPDATE: The token is NOT here anymore. It was sent as an HttpOnly cookie!
            // We only need to store the UI profile data.
            const { role, full_name, user_id } = res.data;

            sessionStorage.setItem('userRole', role);
            sessionStorage.setItem('userName', full_name);
            sessionStorage.setItem('userId', user_id); 

            onLoginSuccess();
        } catch (err) {
            console.error("Login Error:", err);
            const message = err.response?.data?.detail || "System unreachable. Please check your connection.";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // Beautiful modern radial gradient background
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans">
            <div className="w-full max-w-[420px] animate-in fade-in zoom-in duration-500">
                
                <div className="flex flex-col items-center mb-8 sm:mb-10">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-800 rounded-[20px] sm:rounded-[22px] flex items-center justify-center text-white shadow-xl shadow-slate-300 mb-4 transition-transform hover:scale-110">
                        <Activity size={28} className="sm:w-8 sm:h-8" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Medicare ERP</h1>
                    <p className="text-slate-500 font-bold text-[10px] sm:text-xs uppercase tracking-[0.2em] mt-1.5 sm:mt-2">Clinical Management System</p>
                </div>

                <div className="bg-white p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] border border-white/50 shadow-2xl shadow-slate-200/60 backdrop-blur-xl">
                    <h2 className="text-lg sm:text-xl font-black text-slate-800 mb-6 sm:mb-8">Secure Login</h2>

                    {error && (
                        <div className="mb-5 sm:mb-6 p-4 bg-red-50 border border-red-100 rounded-xl sm:rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
                            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
                            <p className="text-[11px] sm:text-xs font-bold text-red-700 leading-relaxed">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                        <div className="space-y-1.5 sm:space-y-2">
                            <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-800 transition-colors sm:w-[18px] sm:h-[18px]" size={16} />
                                <input 
                                    type="email" 
                                    required
                                    placeholder="desk@medicare.io"
                                    className="w-full pl-11 sm:pl-12 pr-4 py-3.5 sm:py-4 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl outline-none text-xs sm:text-sm font-medium focus:border-slate-800 focus:bg-white focus:ring-4 focus:ring-slate-100 transition-all"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5 sm:space-y-2">
                            <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-800 transition-colors sm:w-[18px] sm:h-[18px]" size={16} />
                                <input 
                                    // 🚨 Dynamic Type Switching 🚨
                                    type={showPassword ? "text" : "password"} 
                                    required
                                    placeholder="••••••••"
                                    // Notice pr-12 below so text doesn't hit the eye icon
                                    className="w-full pl-11 sm:pl-12 pr-12 py-3.5 sm:py-4 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl outline-none text-xs sm:text-sm font-medium focus:border-slate-800 focus:bg-white focus:ring-4 focus:ring-slate-100 transition-all"
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                />
                                
                                {/* 🚨 The Eye Button 🚨 */}
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 focus:outline-none transition-colors"
                                >
                                    {showPassword ? <EyeOff size={16} className="sm:w-[18px] sm:h-[18px]" /> : <Eye size={16} className="sm:w-[18px] sm:h-[18px]" />}
                                </button>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full bg-slate-800 text-white py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-[0.15em] shadow-lg shadow-slate-300 hover:bg-slate-900 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:bg-slate-200 mt-2 sm:mt-0"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={16}/> : <LogIn size={16}/>}
                            {isLoading ? 'Authenticating...' : 'Access System'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;