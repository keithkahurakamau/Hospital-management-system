import React, { useState } from 'react';
import api from '../api/axiosConfig';
import { LogIn, Lock, Mail, AlertCircle, Activity, Loader2 } from 'lucide-react';

const Login = ({ onLoginSuccess }) => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault(); 
        setError(null);
        setIsLoading(true);

        try {
            const res = await api.post('/auth/login', formData);
            const { access_token, role, full_name, user_id } = res.data;

            sessionStorage.setItem('token', access_token);
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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 font-sans">
            <div className="w-full max-w-[420px] animate-in fade-in zoom-in duration-500">
                
                <div className="flex flex-col items-center mb-8 sm:mb-10">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-800 rounded-[20px] sm:rounded-[22px] flex items-center justify-center text-white shadow-2xl shadow-slate-200 mb-4 transition-transform hover:scale-110">
                        <Activity size={28} className="sm:w-8 sm:h-8" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Medicare ERP</h1>
                    <p className="text-slate-400 font-bold text-[10px] sm:text-xs uppercase tracking-[0.2em] mt-1.5 sm:mt-2">Clinical Management System</p>
                </div>

                <div className="bg-white p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] border border-slate-200 shadow-xl shadow-slate-200/50">
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
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-800 transition-colors" size={16} className="sm:w-[18px] sm:h-[18px]" />
                                <input 
                                    type="email" 
                                    required
                                    placeholder="desk@medicare.io"
                                    className="w-full pl-11 sm:pl-12 pr-4 py-3.5 sm:py-4 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl outline-none text-xs sm:text-sm font-medium focus:border-slate-800 focus:bg-white transition-all"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5 sm:space-y-2">
                            <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-800 transition-colors" size={16} className="sm:w-[18px] sm:h-[18px]" />
                                <input 
                                    type="password" 
                                    required
                                    placeholder="••••••••"
                                    className="w-full pl-11 sm:pl-12 pr-4 py-3.5 sm:py-4 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl outline-none text-xs sm:text-sm font-medium focus:border-slate-800 focus:bg-white transition-all"
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full bg-slate-800 text-white py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-[0.15em] shadow-lg shadow-slate-200 hover:bg-slate-900 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:bg-slate-200 mt-2 sm:mt-0"
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