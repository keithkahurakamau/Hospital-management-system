import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/axiosConfig';
import { 
    ShieldCheck, Users, Key, Save, AlertCircle, 
    UserCog, ToggleRight, ToggleLeft, Loader2, 
    UserPlus, Plus, X, Info, User, Trash2
} from 'lucide-react';

const UserManagement = () => {
    const [activeTab, setActiveTab] = useState('directory'); 
    const [staff, setStaff] = useState([]);
    const [privileges, setPrivileges] = useState({});
    const [systemPrivileges, setSystemPrivileges] = useState({});
    const [selectedRole, setSelectedRole] = useState('RECEPTIONIST');
    const [selectedAuditUser, setSelectedAuditUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [showAddUser, setShowAddUser] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [newUser, setNewUser] = useState({ full_name: '', email: '', password: '', role: '' });

    const baseRoles = ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PHARMACIST', 'LAB_TECH'];

    useEffect(() => { fetchData(); }, []);
    useEffect(() => { setSelectedAuditUser(null); }, [selectedRole]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [staffRes, privRes, sysPrivRes] = await Promise.all([
                api.get('/users/'),
                api.get('/users/roles/privileges/'),
                api.get('/users/system-privileges/')
            ]);
            setStaff(staffRes.data || []);
            setPrivileges(privRes.data || {});
            setSystemPrivileges(sysPrivRes.data || {});
            
            if (privRes.data && !privRes.data[selectedRole]) {
                setSelectedRole(Object.keys(privRes.data)[0]);
            }
        } catch (err) {
            console.error("Failed to load access control data:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const dynamicRoles = useMemo(() => {
        const privRoles = Object.keys(privileges);
        const staffRoles = staff.map(u => u.role).filter(Boolean);
        return [...new Set([...baseRoles, ...privRoles, ...staffRoles])].sort();
    }, [privileges, staff]);

    const usersInRole = useMemo(() => {
        return staff.filter(u => u.role === selectedRole);
    }, [staff, selectedRole]);

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            const formattedRole = newUser.role.trim().toUpperCase().replace(/\s+/g, '_');
            if (!formattedRole) return alert("Please specify a role.");

            if (!dynamicRoles.includes(formattedRole)) {
                await api.post('/users/roles/', { role: formattedRole });
            }

            await api.post('/users/', { ...newUser, role: formattedRole });
            alert(`Staff member registered as ${formattedRole.replace('_', ' ')}!`);
            setNewUser({ full_name: '', email: '', password: '', role: '' });
            setShowAddUser(false);
            fetchData(); 
        } catch (err) {
            alert(err.response?.data?.detail || "Failed to create user.");
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

    const toggleUserStatus = async (userId, currentStatus) => {
        try {
            await api.put(`/users/${userId}/status`, { is_active: !currentStatus });
            setStaff(staff.map(user => user.user_id === userId ? { ...user, is_active: !currentStatus } : user));
        } catch (err) {
            alert("Failed to change user status.");
        }
    };

    const handleDeleteUser = async (userId, userName) => {
        const confirmed = window.confirm(`Permanently delete ${userName}? \n\nWARNING: If they have created clinical records, you must Suspend them instead.`);
        if (confirmed) {
            try {
                await api.delete(`/users/${userId}`);
                setStaff(staff.filter(user => user.user_id !== userId));
            } catch (err) {
                alert(err.response?.data?.detail || "Failed to delete user.");
            }
        }
    };

    const handleAddRole = async () => {
        if (!newRoleName.trim()) return;
        const formattedRole = newRoleName.trim().toUpperCase().replace(/\s+/g, '_');
        if (privileges[formattedRole]) return alert("Role already exists.");

        try {
            await api.post('/users/roles/', { role: formattedRole });
            setPrivileges({ ...privileges, [formattedRole]: {} });
            setSelectedRole(formattedRole);
            setNewRoleName('');
        } catch (err) {
            alert("Failed to create role.");
        }
    };

    const handleDeleteRole = async () => {
        if (baseRoles.includes(selectedRole)) {
            return alert("Core system roles cannot be deleted.");
        }
        
        if (usersInRole.length > 0) {
            return alert(`Cannot delete this role. There are ${usersInRole.length} staff members assigned to it. Please reassign them in the Staff Directory first.`);
        }

        const confirmed = window.confirm(`Are you sure you want to permanently delete the ${selectedRole.replace('_', ' ')} role?`);
        if (confirmed) {
            try {
                await api.delete(`/users/roles/${selectedRole}`);
                const newPrivs = { ...privileges };
                delete newPrivs[selectedRole];
                setPrivileges(newPrivs);
                setSelectedRole('RECEPTIONIST'); 
                fetchData(); 
            } catch (err) {
                alert(err.response?.data?.detail || "Failed to delete role.");
            }
        }
    };

    const handleToggle = (permKey) => {
        setPrivileges(prev => {
            const currentRolePerms = prev[selectedRole] || {};
            return {
                ...prev,
                [selectedRole]: { ...currentRolePerms, [permKey]: !currentRolePerms[permKey] }
            };
        });
    };

    const savePrivileges = async () => {
        setIsSaving(true);
        try {
            await api.put(`/users/roles/${selectedRole}/privileges`, { permissions: privileges[selectedRole] || {} });
            setTimeout(() => setIsSaving(false), 500); 
        } catch (err) {
            alert("Failed to save privileges.");
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="flex h-[85vh] items-center justify-center"><Loader2 className="animate-spin text-purple-600" size={40}/></div>;

    return (
        <div className="w-full max-w-[1400px] mx-auto min-h-[85vh] flex flex-col gap-4 lg:gap-6 font-sans animate-in fade-in duration-500">
            <div className="bg-white p-5 lg:p-8 rounded-[24px] lg:rounded-[32px] border border-slate-200 shadow-sm shrink-0">
                <div className="flex justify-between items-end mb-4 lg:mb-8">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2 lg:gap-3">
                            <ShieldCheck className="text-purple-600 lg:w-8 lg:h-8" size={24}/> Access Control
                        </h1>
                        <p className="text-slate-500 font-medium text-xs lg:text-sm mt-1 lg:mt-2">Manage hospital staff and security clearances.</p>
                    </div>
                </div>

                <div className="flex gap-2 lg:gap-4 border-b border-slate-100 pb-0 overflow-x-auto custom-scrollbar">
                    <button onClick={() => setActiveTab('directory')} className={`pb-3 lg:pb-4 px-3 lg:px-4 font-bold text-xs lg:text-sm border-b-2 transition-all whitespace-nowrap ${activeTab === 'directory' ? 'border-slate-800 text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                        <span className="flex items-center gap-2"><Users size={16} className="lg:w-[18px] lg:h-[18px]"/> Staff Directory</span>
                    </button>
                    <button onClick={() => setActiveTab('privileges')} className={`pb-3 lg:pb-4 px-3 lg:px-4 font-bold text-xs lg:text-sm border-b-2 transition-all whitespace-nowrap ${activeTab === 'privileges' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                        <span className="flex items-center gap-2"><Key size={16} className="lg:w-[18px] lg:h-[18px]"/> System Privileges</span>
                    </button>
                </div>
            </div>

            {activeTab === 'directory' && (
                <div className="bg-white rounded-[24px] lg:rounded-[32px] border border-slate-200 shadow-sm flex flex-col overflow-hidden min-h-[400px]">
                    <div className="p-4 lg:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3 lg:gap-0 bg-slate-50/50">
                        <h2 className="text-base lg:text-lg font-black text-slate-800">Active Personnel</h2>
                        <button onClick={() => setShowAddUser(!showAddUser)} className="w-full sm:w-auto bg-slate-800 text-white px-4 lg:px-5 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl text-[10px] lg:text-xs font-black uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-sm">
                            {showAddUser ? <X size={14} className="lg:w-4 lg:h-4"/> : <UserPlus size={14} className="lg:w-4 lg:h-4"/>} {showAddUser ? 'Cancel' : 'Register Staff'}
                        </button>
                    </div>

                    {showAddUser && (
                        <form onSubmit={handleAddUser} className="p-4 lg:p-6 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 lg:gap-4 items-start animate-in slide-in-from-top-4">
                            <div className="space-y-1.5 lg:space-y-2">
                                <label className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                                <input required type="text" className="w-full p-2.5 lg:p-3 rounded-xl lg:rounded-2xl border border-slate-200 text-xs lg:text-sm font-bold outline-none focus:border-purple-500 shadow-inner" value={newUser.full_name} onChange={e => setNewUser({...newUser, full_name: e.target.value})} placeholder="Dr. Jane Doe"/>
                            </div>
                            <div className="space-y-1.5 lg:space-y-2">
                                <label className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                                <input required type="email" className="w-full p-2.5 lg:p-3 rounded-xl lg:rounded-2xl border border-slate-200 text-xs lg:text-sm font-bold outline-none focus:border-purple-500 shadow-inner" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} placeholder="jane@medicare.io"/>
                            </div>
                            <div className="space-y-1.5 lg:space-y-2">
                                <label className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Temp Password</label>
                                <input required type="password" className="w-full p-2.5 lg:p-3 rounded-xl lg:rounded-2xl border border-slate-200 text-xs lg:text-sm font-bold outline-none focus:border-purple-500 shadow-inner" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="••••••••"/>
                            </div>
                            <div className="space-y-1.5 lg:space-y-2 relative">
                                <div className="flex justify-between items-center ml-1 pr-1">
                                    <label className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-slate-400">Assign Role</label>
                                    <span className="text-[8px] lg:text-[9px] text-purple-500 font-bold flex items-center gap-1"><Info size={10}/> Type to create</span>
                                </div>
                                <input required list="role-options" type="text" autoComplete="off" className="w-full p-2.5 lg:p-3 rounded-xl lg:rounded-2xl border border-slate-200 text-xs lg:text-sm font-bold outline-none focus:border-purple-500 uppercase placeholder:normal-case placeholder:font-normal shadow-inner" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value.toUpperCase()})} placeholder="Select or type new..."/>
                                <datalist id="role-options">{dynamicRoles.map(r => <option key={r} value={r.replace('_', ' ')} />)}</datalist>
                            </div>
                            <button type="submit" className="p-3 lg:p-3.5 sm:mt-[22px] lg:mt-[26px] bg-purple-600 text-white rounded-xl lg:rounded-2xl font-black text-[10px] lg:text-xs uppercase tracking-widest hover:bg-purple-700 transition-all w-full shadow-lg shadow-purple-200">Save User</button>
                        </form>
                    )}

                    <div className="flex-1 overflow-x-auto w-full custom-scrollbar">
                        <table className="w-full min-w-[700px] text-left border-collapse">
                            <thead className="bg-white border-b border-slate-100">
                                <tr>
                                    <th className="p-4 lg:p-6 pl-6 lg:pl-8 text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-slate-400">Staff Member</th>
                                    <th className="p-4 lg:p-6 text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-slate-400">System Role</th>
                                    <th className="p-4 lg:p-6 pr-6 lg:pr-8 text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions & Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {staff.map(user => (
                                    <tr key={user.user_id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 lg:p-6 pl-6 lg:pl-8">
                                            <p className="font-black text-slate-800 text-xs lg:text-sm">{user.full_name}</p>
                                            <p className="text-[10px] lg:text-xs font-bold text-slate-400 mt-0.5">{user.email}</p>
                                        </td>
                                        <td className="p-4 lg:p-6">
                                            <select value={user.role} onChange={(e) => handleRoleChange(user.user_id, e.target.value)} disabled={user.role === 'ADMIN'} className="bg-slate-50 border border-slate-200 text-slate-700 text-[10px] lg:text-xs font-bold rounded-lg lg:rounded-xl px-2 lg:px-3 py-1.5 lg:py-2 outline-none focus:border-slate-400 disabled:opacity-50 uppercase cursor-pointer">
                                                {dynamicRoles.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                                            </select>
                                        </td>
                                        <td className="p-4 lg:p-6 pr-6 lg:pr-8 flex items-center justify-end gap-2 lg:gap-3 h-full">
                                            <button onClick={() => toggleUserStatus(user.user_id, user.is_active)} disabled={user.role === 'ADMIN'} className={`px-2 lg:px-3 py-1 lg:py-1.5 text-[8px] lg:text-[9px] font-black uppercase tracking-widest rounded-md lg:rounded-lg transition-all ${user.is_active ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200/50' : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200/50'}`}>
                                                {user.is_active ? 'Active' : 'Suspended'}
                                            </button>
                                            <button onClick={() => handleDeleteUser(user.user_id, user.full_name)} disabled={user.role === 'ADMIN'} className="p-1.5 lg:p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-20" title="Permanently Delete User">
                                                <Trash2 size={16} className="lg:w-4 lg:h-4"/>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'privileges' && (
                // 3-Pane Layout: Stacks on mobile/tablet, side-by-side on xl desktops
                <div className="flex flex-col xl:flex-row gap-4 lg:gap-6 flex-1 h-auto xl:h-[650px]">
                    
                    {/* Pane 1 & 2 Wrapper (Side by side on tablet, stacked on mobile, left block on desktop) */}
                    <div className="flex flex-col sm:flex-row xl:flex-col gap-4 lg:gap-6 xl:w-72 shrink-0">
                        
                        {/* Target Role Selector */}
                        <div className="w-full sm:w-1/2 xl:w-full bg-white rounded-[24px] lg:rounded-[32px] border border-slate-200 shadow-sm flex flex-col overflow-hidden h-[300px] xl:h-1/2">
                            <div className="p-4 lg:p-6 bg-slate-50/50 border-b border-slate-100"><p className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Target Role</p></div>
                            <div className="flex-1 overflow-y-auto p-2 lg:p-3 flex flex-col gap-1 custom-scrollbar">
                                {dynamicRoles.map(role => (
                                    <button key={role} onClick={() => setSelectedRole(role)} className={`p-3 lg:p-4 rounded-xl lg:rounded-2xl text-left font-black text-[10px] lg:text-xs uppercase tracking-wide transition-all flex items-center gap-2 lg:gap-3 ${selectedRole === role ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-sm' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}`}>
                                        <UserCog size={16} className="lg:w-4 lg:h-4"/> <span className="truncate">{role.replace('_', ' ')}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="p-3 lg:p-4 bg-slate-50 border-t border-slate-100">
                                <label className="text-[8px] lg:text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1.5 lg:mb-2 ml-1">Create Custom Role</label>
                                <div className="flex gap-2">
                                    <input type="text" value={newRoleName} onChange={e => setNewRoleName(e.target.value)} placeholder="e.g. SURGEON" className="flex-1 w-0 px-3 py-2 lg:py-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-purple-400 uppercase shadow-inner" />
                                    <button onClick={handleAddRole} className="p-2 lg:p-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 shrink-0 transition-colors"><Plus size={16} className="lg:w-4 lg:h-4"/></button>
                                </div>
                            </div>
                        </div>

                        {/* Assigned Personnel */}
                        <div className="w-full sm:w-1/2 xl:w-full bg-white rounded-[24px] lg:rounded-[32px] border border-slate-200 shadow-sm flex flex-col overflow-hidden h-[300px] xl:h-1/2">
                            <div className="p-4 lg:p-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                                <p className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Personnel</p>
                                <span className="bg-slate-200 text-slate-600 text-[9px] px-2 py-0.5 rounded font-black">{usersInRole.length}</span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 lg:p-3 flex flex-col gap-1.5 lg:gap-2 custom-scrollbar">
                                {usersInRole.length === 0 ? (
                                    <div className="text-center p-8 opacity-40"><Users size={28} className="mx-auto mb-2 text-slate-400 lg:w-8 lg:h-8" /><p className="text-[10px] lg:text-xs font-bold text-slate-500 leading-tight">No staff assigned.</p></div>
                                ) : usersInRole.map(user => (
                                    <button key={user.user_id} onClick={() => setSelectedAuditUser(user)} className={`p-3 lg:p-4 rounded-xl lg:rounded-2xl text-left transition-all flex items-center gap-2.5 lg:gap-3 border ${selectedAuditUser?.user_id === user.user_id ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm' : 'hover:bg-slate-50 border-transparent text-slate-600'}`}>
                                        <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0 border border-slate-100"><User size={12} className={selectedAuditUser?.user_id === user.user_id ? 'text-blue-600' : 'text-slate-400'}/></div>
                                        <div className="truncate">
                                            <p className="font-black text-[10px] lg:text-xs uppercase truncate">{user.full_name}</p>
                                            <p className="text-[8px] lg:text-[9px] font-bold opacity-60 truncate mt-0.5">{user.email}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Pane 3: Privileges Form */}
                    <div className="flex-1 bg-white rounded-[24px] lg:rounded-[32px] border border-slate-200 shadow-sm flex flex-col overflow-hidden min-h-[500px] xl:h-full">
                        <div className="p-5 lg:p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                            <div>
                                <h2 className="text-lg lg:text-xl font-black text-slate-800 uppercase tracking-tight truncate">{selectedAuditUser ? `${selectedAuditUser.full_name}'s Clearances` : `${selectedRole.replace('_', ' ')} Clearances`}</h2>
                                <p className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{selectedAuditUser ? `Inherited via the ${selectedRole.replace('_', ' ')} role` : 'Role-level privileges'}</p>
                            </div>
                            
                            <div className="flex items-center gap-2 lg:gap-3 shrink-0">
                                {!baseRoles.includes(selectedRole) && (
                                    <button onClick={handleDeleteRole} className="p-2.5 lg:p-3 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 rounded-xl lg:rounded-2xl transition-all" title="Delete Role">
                                        <Trash2 size={16} className="lg:w-4 lg:h-4"/>
                                    </button>
                                )}
                                <button onClick={savePrivileges} disabled={isSaving} className="w-full sm:w-auto bg-purple-600 text-white px-5 lg:px-6 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl font-black text-[9px] lg:text-[10px] uppercase tracking-[0.15em] shadow-lg shadow-purple-200 hover:bg-purple-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                    {isSaving ? <Loader2 className="animate-spin lg:w-4 lg:h-4" size={16}/> : <Save size={16} className="lg:w-4 lg:h-4"/>} {isSaving ? 'Deploying...' : 'Save Updates'}
                                </button>
                            </div>
                        </div>

                        <div className="p-5 lg:p-8 grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-5 overflow-y-auto custom-scrollbar flex-1">
                            {Object.entries(systemPrivileges).map(([key, label]) => {
                                const isGranted = privileges[selectedRole]?.[key] || false;
                                return (
                                    <div key={key} onClick={() => handleToggle(key)} className={`p-4 lg:p-5 rounded-[20px] lg:rounded-[24px] border cursor-pointer transition-all flex items-center justify-between group ${isGranted ? 'bg-white border-purple-200 shadow-sm hover:border-purple-400' : 'bg-slate-50 border-slate-200 opacity-60 hover:opacity-100'}`}>
                                        <div className="pr-4">
                                            <p className={`font-black text-xs lg:text-sm uppercase tracking-tight leading-tight ${isGranted ? 'text-slate-800' : 'text-slate-500'}`}>{label}</p>
                                            <p className="text-[8px] lg:text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 lg:mt-1.5">{isGranted ? 'Access Granted' : 'Restricted'}</p>
                                        </div>
                                        <div className={`transition-colors duration-300 shrink-0 ${isGranted ? 'text-purple-600' : 'text-slate-300 group-hover:text-slate-400'}`}>
                                            {isGranted ? <ToggleRight size={32} className="lg:w-9 lg:h-9" strokeWidth={1.5} /> : <ToggleLeft size={32} className="lg:w-9 lg:h-9" strokeWidth={1.5} />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div className="p-4 bg-amber-50 border-t border-amber-100 flex items-start sm:items-center gap-3 shrink-0">
                            <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5 sm:mt-0"/>
                            <p className="text-[9px] lg:text-[10px] font-bold text-amber-800 uppercase tracking-widest leading-relaxed">
                                Modifying these toggles updates the {selectedRole.replace('_', ' ')} profile. Changes apply instantly to all assigned users.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;