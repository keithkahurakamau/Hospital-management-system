import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { 
    ShieldCheck, Users, Key, Save, AlertCircle, 
    UserCog, ToggleRight, ToggleLeft, Loader2 
} from 'lucide-react';

const UserManagement = () => {
    const [activeTab, setActiveTab] = useState('directory'); 
    const [staff, setStaff] = useState([]);
    const [privileges, setPrivileges] = useState({});
    const [systemPrivileges, setSystemPrivileges] = useState({}); // Master List
    const [selectedRole, setSelectedRole] = useState('RECEPTIONIST');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        
        try {
            const [staffRes, privRes, sysPrivRes] = await Promise.all([
                api.get('/users'),
                api.get('/users/roles/privileges'),
                api.get('/users/system-privileges') // Fetch the Master List
            ]);
            setStaff(staffRes.data || []);
            setPrivileges(privRes.data || {});
            setSystemPrivileges(sysPrivRes.data || {});
        } catch (err) {
            console.error("Failed to load access control data:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await api.put(`/users/${userId}/role`, { role: newRole });
            setStaff(staff.map(user => user.user_id === userId ? { ...user, role: newRole } : user));
        } catch (err) {
            alert("Failed to update user role.");
        }
    };

    // Safely toggle the permission, even if it hasn't been defined for this role yet
    const handleToggle = (permKey) => {
        setPrivileges(prev => {
            const currentRolePerms = prev[selectedRole] || {};
            return {
                ...prev,
                [selectedRole]: {
                    ...currentRolePerms,
                    [permKey]: !currentRolePerms[permKey]
                }
            };
        });
    };

    const savePrivileges = async () => {
        setIsSaving(true);
        try {
            await api.put(`/users/roles/${selectedRole}/privileges`, { 
                permissions: privileges[selectedRole] || {}
            });
            setTimeout(() => setIsSaving(false), 500); 
        } catch (err) {
            alert("Failed to save privileges. Check server logs.");
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[85vh] items-center justify-center text-slate-400">
                <Loader2 className="animate-spin" size={32}/>
            </div>
        );
    }

    return (
        <div className="max-w-[1200px] mx-auto min-h-[85vh] flex flex-col gap-6 font-sans animate-in fade-in duration-500">
            
            {/* Header & Tabs */}
            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                            <ShieldCheck size={32} className="text-purple-600"/>
                            Access Control
                        </h1>
                        <p className="text-slate-500 font-medium text-sm mt-1">Manage hospital staff and security clearances.</p>
                    </div>
                </div>

                <div className="flex gap-4 border-b border-slate-100 pb-0">
                    <button 
                        onClick={() => setActiveTab('directory')}
                        className={`pb-4 px-4 font-bold text-sm border-b-2 transition-all ${activeTab === 'directory' ? 'border-slate-800 text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        <span className="flex items-center gap-2"><Users size={16}/> Staff Directory</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('privileges')}
                        className={`pb-4 px-4 font-bold text-sm border-b-2 transition-all ${activeTab === 'privileges' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        <span className="flex items-center gap-2"><Key size={16}/> System Privileges</span>
                    </button>
                </div>
            </div>

            {/* TAB 1: STAFF DIRECTORY */}
            {activeTab === 'directory' && (
                <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex-1">
                    {staff.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 font-bold text-sm">
                            <Users size={48} className="mx-auto mb-4 opacity-50" />
                            No staff members found in the database.
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Staff Member</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">System Role</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {staff.map(user => (
                                    <tr key={user.user_id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-6 font-bold text-slate-800 text-sm flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-500">
                                                {user.full_name ? user.full_name.charAt(0) : '?'}
                                            </div>
                                            {user.full_name}
                                        </td>
                                        <td className="p-6 text-sm text-slate-500 font-medium">{user.email}</td>
                                        <td className="p-6">
                                            <select 
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.user_id, e.target.value)}
                                                disabled={user.role === 'ADMIN'}
                                                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-3 py-2 outline-none focus:border-slate-400 disabled:opacity-50"
                                            >
                                                <option value="ADMIN">Administrator</option>
                                                <option value="DOCTOR">Doctor</option>
                                                <option value="RECEPTIONIST">Receptionist</option>
                                                <option value="PHARMACIST">Pharmacist</option>
                                                <option value="LAB_TECH">Lab Technician</option>
                                            </select>
                                        </td>
                                        <td className="p-6">
                                            <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md ${user.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                                {user.is_active ? 'Active' : 'Suspended'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* TAB 2: SYSTEM PRIVILEGES */}
            {activeTab === 'privileges' && (
                <div className="flex gap-6 flex-1 h-[500px]">
                    {/* Role Selector Sidebar */}
                    <div className="w-64 bg-white rounded-[32px] border border-slate-200 shadow-sm p-4 flex flex-col gap-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest p-4 pb-2">Select Target Role</p>
                        {['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PHARMACIST', 'LAB_TECH'].map(role => (
                            <button 
                                key={role}
                                onClick={() => setSelectedRole(role)}
                                className={`p-4 rounded-2xl text-left font-bold text-sm transition-all flex items-center gap-3 ${selectedRole === role ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}`}
                            >
                                <UserCog size={16}/> {role}
                            </button>
                        ))}
                    </div>

                    {/* Permission Toggles */}
                    <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-black text-slate-800">{selectedRole} Clearances</h2>
                                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Toggle modules this role can access</p>
                            </div>
                            <button 
                                onClick={savePrivileges}
                                disabled={isSaving}
                                className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-purple-200 hover:bg-purple-700 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}
                                {isSaving ? 'Deploying...' : 'Save & Deploy'}
                            </button>
                        </div>

                        <div className="p-8 grid grid-cols-2 gap-6 overflow-y-auto">
                            {/* Iterate over the MASTER list, not just what the user currently has */}
                            {Object.entries(systemPrivileges).map(([key, label]) => {
                                // Default to false if the role doesn't have this key configured yet
                                const isGranted = privileges[selectedRole]?.[key] || false;
                                
                                return (
                                    <div 
                                        key={key} 
                                        onClick={() => handleToggle(key)}
                                        className={`p-5 rounded-[24px] border cursor-pointer transition-all flex items-center justify-between group ${isGranted ? 'bg-white border-purple-200 shadow-sm hover:border-purple-300' : 'bg-slate-50 border-slate-200 opacity-60 hover:opacity-100'}`}
                                    >
                                        <div>
                                            <p className={`font-bold text-sm ${isGranted ? 'text-slate-800' : 'text-slate-500'}`}>
                                                {label}
                                            </p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                                {isGranted ? 'Access Granted' : 'Restricted'}
                                            </p>
                                        </div>
                                        <div className={`transition-colors duration-300 ${isGranted ? 'text-purple-600' : 'text-slate-300 group-hover:text-slate-400'}`}>
                                            {isGranted ? <ToggleRight size={36} strokeWidth={1.5} /> : <ToggleLeft size={36} strokeWidth={1.5} />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div className="p-6 bg-amber-50 border-t border-amber-100 flex items-start gap-3 mt-auto">
                            <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5"/>
                            <p className="text-xs font-bold text-amber-800 leading-relaxed">
                                Changes deployed here are instantly pushed to all online {selectedRole} users via WebSockets.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;