import React, { useState, useEffect } from 'react';
import AdminDashboard from './AdminDashboard'; 
import api from '../api/axiosConfig.js';
import { 
    Users, Stethoscope, Pill, Receipt, 
    FlaskConical, Settings, ChevronRight, Clock
} from 'lucide-react';

const PRIORITY_COLORS = {
    high: 'bg-red-50 text-red-600 border-red-200',
    medium: 'bg-orange-50 text-orange-600 border-orange-200',
    normal: 'bg-amber-50 text-amber-600 border-amber-200',
    low: 'bg-emerald-50 text-emerald-600 border-emerald-200'
};

const STATUS_COLORS = {
    pending: 'bg-slate-50 text-slate-600',
    scheduled: 'bg-blue-50 text-blue-600',
    'in-progress': 'bg-purple-50 text-purple-600',
    completed: 'bg-emerald-50 text-emerald-600'
};

// Permission to Module Map (from SYSTEM_PRIVILEGES → ALL_MODULES)
const PERMISSION_MAP = {
    'consult_patients': 'clinical',
    'register_patients': 'patients',
    'manage_labs': 'lab',
    'manage_inventory': 'pharmacy',
    'view_financials': 'billing',
    'manage_stock': 'inventory',
    'manage_appointments': 'patients',
    'manage_beds': 'patients',
    'view_reports': null,
    'manage_users': null
};

// 1. THE MASTER MODULE DICTIONARY
const ALL_MODULES = {
    patients: { id: 'patients', label: 'Patient Registry', icon: Users, color: 'bg-purple-500', path: '/patients' },
    clinical: { id: 'clinical', label: 'Clinical Flow', icon: Stethoscope, color: 'bg-blue-500', path: '/clinical' },
    pharmacy: { id: 'pharmacy', label: 'Pharmacy & Inventory', icon: Pill, color: 'bg-emerald-500', path: '/pharmacy' },
    billing: { id: 'billing', label: 'Billing & Cashier', icon: Receipt, color: 'bg-rose-500', path: '/billing' },
    lab: { id: 'lab', label: 'Laboratory', icon: FlaskConical, color: 'bg-amber-500', path: '/lab' },
};

const Dashboard = () => {
    const userRole = sessionStorage.getItem('userRole') || 'UNKNOWN';
    const userName = sessionStorage.getItem('userName') || 'Medical Staff';
    const [allowedModules, setAllowedModules] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [loadingPerms, setLoadingPerms] = useState(true);

    // Dynamic Permissions from Backend
    useEffect(() => {
        const fetchPermissions = async () => {
            if (userRole === 'ADMIN') {
                setLoadingPerms(false);
                return;
            }
            try {
                const res = await api.get('/users/me/permissions/');
                const userPerms = res.data.permissions || {};
                
                // Map true permissions to module IDs
                const allowedModIds = Object.keys(userPerms)
                    .filter(key => userPerms[key] === true)
                    .map(key => PERMISSION_MAP[key])
                    .filter(Boolean);
                
                const generatedDashboard = allowedModIds
                    .map(modId => ALL_MODULES[modId])
                    .filter(Boolean);
                
                setAllowedModules(generatedDashboard);
            } catch (err) {
                console.error('Failed to fetch permissions:', err);
                setAllowedModules([]);
            } finally {
                setLoadingPerms(false);
            }
        };
        fetchPermissions();
    }, [userRole]);

    // Live Clock
    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setCurrentTime(now);
        };
        updateTime();
        const interval = setInterval(updateTime, 60000);
        return () => clearInterval(interval);
    }, []);

    // Fetch Worker Agenda
    useEffect(() => {
        if (userRole === 'ADMIN') return;
        const fetchTasks = async () => {
            try {
                const res = await api.get('/dashboard/worker-agenda');
                setTasks(res.data);
            } catch (err) {
                console.error('Failed to fetch agenda:', err);
                setTasks([]);
            }
        };
        fetchTasks();
    }, [userRole]);

    if (userRole === 'ADMIN') {
        return <AdminDashboard />;
    }

    return (
        <div className="p-4 lg:p-8 animate-in fade-in duration-500 max-w-7xl mx-auto bg-slate-50 min-h-screen">
            
            {/* Dynamic Welcome Header */}
            <div className="mb-8 lg:mb-10 bg-white p-6 lg:p-10 rounded-[24px] lg:rounded-[32px] border border-slate-200 shadow-sm">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <Clock className="w-6 h-6 text-slate-400" />
                        <span className="text-lg font-black text-slate-600">
                            {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                            <span className="text-slate-400 font-normal"> • </span>
                            {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </span>
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight">
                        Welcome back, {userName.split(' ')[0]}.
                    </h2>
                    <p className="text-slate-500 font-medium text-sm max-w-xl">
                        Your {userRole.replace('_', ' ').toLowerCase()} workspace. Modules based on your database permissions.
                    </p>
                </div>
            </div>

            {/* Dynamic Grid */}
            {loadingPerms ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400"></div>
                    <span className="ml-3 text-slate-500 font-medium">Loading your workspace...</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {allowedModules.length === 0 ? (
                        <div className="col-span-full text-center py-20 bg-white rounded-[24px] border border-slate-200 shadow-sm">
                            <Settings className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                            <h3 className="text-2xl font-black text-slate-800 mb-2">No Modules Assigned</h3>
                            <p className="text-slate-500 mb-6 max-w-md mx-auto">Contact administrator to grant permissions via User Management.</p>
                            <button 
                                onClick={() => window.location.href = '/settings'}
                                className="px-6 py-2.5 bg-slate-900 text-white font-black uppercase tracking-wider rounded-2xl hover:bg-slate-800 transition-all shadow-lg"
                            >
                                System Settings
                            </button>
                        </div>
                    ) : (
                        allowedModules.map((module) => {
                            const Icon = module.icon;
                            return (
                                <a 
                                    key={module.id}
                                    href={module.path}
                                    className="group relative bg-white p-6 rounded-[24px] lg:rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl hover:border-slate-300 hover:-translate-y-1 transition-all overflow-hidden flex flex-col h-44"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className={`${module.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform`}>
                                            <Icon size={24} />
                                        </div>
                                    </div>
                                    <h3 className="mt-4 font-black text-xl text-slate-800 leading-tight">{module.label}</h3>
                                </a>
                            );
                        })
                    )}
                    {/* Settings always available */}
                    <a 
                        href="/settings"
                        className="group relative bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-[24px] lg:rounded-[32px] border border-slate-700 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all overflow-hidden flex flex-col h-44 text-white"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10 flex items-center justify-between">
                            <div className="bg-white/20 backdrop-blur-sm w-14 h-14 rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
                                <Settings size={24} />
                            </div>
                        </div>
                        <h3 className="mt-4 font-black text-xl relative z-10">System Settings</h3>
                    </a>
                </div>
            )}

            {/* Today's Agenda */}
            {userRole !== 'ADMIN' && (
                <section className="mt-12">
                    <div className="bg-white p-8 rounded-[24px] lg:rounded-[32px] border border-slate-200 shadow-sm">
                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3 mb-8">
                            <Clock className="w-8 h-8" />
                            Today's Agenda
                        </h3>
                        {tasks.length === 0 ? (
                            <div className="text-center py-16 text-slate-400">
                                <Clock className="w-16 h-16 mx-auto mb-6 opacity-50" />
                                <p className="text-xl font-medium mb-2">No tasks for today</p>
                                <p className="text-sm">Your agenda will appear here.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {tasks.map((task) => (
                                    <div key={task.id} className="group p-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-[24px] border border-slate-200 hover:shadow-lg transition-all hover:-translate-y-0.5">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0 w-2 h-2 bg-slate-400 rounded-full mt-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-black text-slate-800 text-lg leading-tight mb-3">
                                                    {task.title}
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border ${PRIORITY_COLORS[task.priority] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                        {task.priority}
                                                    </span>
                                                    <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border ${STATUS_COLORS[task.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                        {task.status?.replace('-', ' ') || 'pending'}
                                                    </span>
                                                    <span className="ml-auto text-[11px] font-bold uppercase tracking-wider text-slate-500 px-2 py-1 bg-white/50 rounded-lg border border-slate-200">
                                                        {task.time}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* No Modules Empty State */}
            {!loadingPerms && allowedModules.length === 0 && (
                <div className="mt-12 p-12 bg-amber-50 border-2 border-amber-200 rounded-[24px] text-center">
                    <Settings className="w-20 h-20 text-amber-400 mx-auto mb-6" />
                    <h3 className="text-2xl font-black text-slate-800 mb-3">No Access Granted</h3>
                    <p className="text-slate-600 max-w-lg mx-auto mb-8">No modules assigned. Check with administrator.</p>
                    <a href="/settings" className="inline-block px-8 py-3 bg-slate-900 text-white font-black uppercase tracking-wider rounded-2xl hover:bg-slate-800 transition-all shadow-lg">
                        System Settings
                    </a>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
