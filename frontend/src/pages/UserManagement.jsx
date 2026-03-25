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

    // --- USER MANAGEMENT ---
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

    // --- ROLE MANAGEMENT ---
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

    // NEW: Delete Custom Role
    const handleDeleteRole = async () => {
        if (baseRoles.includes(selectedRole)) {
            return alert("Core system roles cannot be deleted.");
        }
        
        // Frontend proactive check
        if (usersInRole.length > 0) {
            return alert(`Cannot delete this role. There are ${usersInRole.length} staff members assigned to it. Please reassign them in the Staff Directory first.`);
        }

        const confirmed = window.confirm(`Are you sure you want to permanently delete the ${selectedRole.replace('_', ' ')} role?`);
        if (confirmed) {
            try {
                await api.delete(`/users/roles/${selectedRole}`);
                
                // Update UI instantly
                const newPrivs = { ...privileges };
                delete newPrivs[selectedRole];
                setPrivileges(newPrivs);
                setSelectedRole('RECEPTIONIST'); // Fallback selection
                fetchData(); // Sync everything
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
        <div className="max-w-[1400px] mx-auto min-h-[85vh] flex flex-col gap-6 font-sans animate-in fade-in duration-500">
            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                            <ShieldCheck size={32} className="text-purple-600"/> Access Control
                        </h1>
                        <p className="text-slate-500 font-medium text-sm mt-1">Manage hospital staff and security clearances.</p>
                    </div>
                </div>

                <div className="flex gap-4 border-b border-slate-100 pb-0">
                    <button onClick={() => setActiveTab('directory')} className={`pb-4 px-4 font-bold text-sm border-b-2 transition-all ${activeTab === 'directory' ? 'border-slate-800 text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                        <span className="flex items-center gap-2"><Users size={16}/> Staff Directory</span>
                    </button>
                    <button onClick={() => setActiveTab('privileges')} className={`pb-4 px-4 font-bold text-sm border-b-2 transition-all ${activeTab === 'privileges' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                        <span className="flex items-center gap-2"><Key size={16}/> System Privileges</span>
                    </button>
                </div>
            </div>

            {activeTab === 'directory' && (
                <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h2 className="text-lg font-black text-slate-800">Active Personnel</h2>
                        <button onClick={() => setShowAddUser(!showAddUser)} className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center gap-2">
                            {showAddUser ? <X size={16}/> : <UserPlus size={16}/>} {showAddUser ? 'Cancel' : 'Register Staff'}
                        </button>
                    </div>

                    {showAddUser && (
                        <form onSubmit={handleAddUser} className="p-6 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-5 gap-4 items-start animate-in slide-in-from-top-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</label>
                                <input required type="text" className="w-full p-3 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-purple-500" value={newUser.full_name} onChange={e => setNewUser({...newUser, full_name: e.target.value})} placeholder="Dr. Jane Doe"/>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address</label>
                                <input required type="email" className="w-full p-3 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-purple-500" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} placeholder="jane@medicare.io"/>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Temp Password</label>
                                <input required type="password" className="w-full p-3 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-purple-500" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="••••••••"/>
                            </div>
                            <div className="space-y-2 relative">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assign Role</label>
                                    <span className="text-[9px] text-purple-500 font-bold flex items-center gap-1"><Info size={10}/> Type to create</span>
                                </div>
                                <input required list="role-options" type="text" autoComplete="off" className="w-full p-3 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-purple-500 uppercase placeholder:normal-case placeholder:font-normal" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value.toUpperCase()})} placeholder="Select or type new..."/>
                                <datalist id="role-options">{dynamicRoles.map(r => <option key={r} value={r.replace('_', ' ')} />)}</datalist>
                            </div>
                            <button type="submit" className="p-3 mt-[26px] bg-purple-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-purple-700 transition-all h-[46px]">Save User</button>
                        </form>
                    )}

                    <table className="w-full text-left">
                        <thead className="bg-white border-b border-slate-100">
                            <tr>
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Staff Member</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">System Role</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions & Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {staff.map(user => (
                                <tr key={user.user_id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-6">
                                        <p className="font-black text-slate-800 text-sm">{user.full_name}</p>
                                        <p className="text-xs font-bold text-slate-400">{user.email}</p>
                                    </td>
                                    <td className="p-6">
                                        <select value={user.role} onChange={(e) => handleRoleChange(user.user_id, e.target.value)} disabled={user.role === 'ADMIN'} className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-3 py-2 outline-none focus:border-slate-400 disabled:opacity-50 uppercase">
                                            {dynamicRoles.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                                        </select>
                                    </td>
                                    <td className="p-6 flex items-center justify-end gap-3 h-full">
                                        <button onClick={() => toggleUserStatus(user.user_id, user.is_active)} disabled={user.role === 'ADMIN'} className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${user.is_active ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200' : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'}`}>
                                            {user.is_active ? 'Active' : 'Suspended'}
                                        </button>
                                        <button onClick={() => handleDeleteUser(user.user_id, user.full_name)} disabled={user.role === 'ADMIN'} className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-md transition-all disabled:opacity-20" title="Permanently Delete User">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'privileges' && (
                <div className="flex gap-6 flex-1 h-[650px]">
                    <div className="w-64 bg-white rounded-[32px] border border-slate-200 shadow-sm flex flex-col overflow-hidden shrink-0">
                        <div className="p-6 bg-slate-50/50 border-b border-slate-100"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Target Role</p></div>
                        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1 custom-scrollbar">
                            {dynamicRoles.map(role => (
                                <button key={role} onClick={() => setSelectedRole(role)} className={`p-4 rounded-2xl text-left font-black text-xs uppercase tracking-wide transition-all flex items-center gap-3 ${selectedRole === role ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-sm' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}`}>
                                    <UserCog size={16}/> <span className="truncate">{role.replace('_', ' ')}</span>
                                </button>
                            ))}
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-2">Create Custom Role</label>
                            <div className="flex gap-2">
                                <input type="text" value={newRoleName} onChange={e => setNewRoleName(e.target.value)} placeholder="e.g. SURGEON" className="flex-1 w-0 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-purple-400 uppercase" />
                                <button onClick={handleAddRole} className="p-2 bg-slate-800 text-white rounded-xl hover:bg-slate-900 shrink-0"><Plus size={16}/></button>
                            </div>
                        </div>
                    </div>

                    <div className="w-72 bg-white rounded-[32px] border border-slate-200 shadow-sm flex flex-col overflow-hidden shrink-0">
                        <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Personnel</p>
                            <span className="bg-slate-200 text-slate-600 text-[9px] px-2 py-0.5 rounded font-black">{usersInRole.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 custom-scrollbar">
                            {usersInRole.length === 0 ? (
                                <div className="text-center p-8 opacity-40"><Users size={32} className="mx-auto mb-2 text-slate-400" /><p className="text-xs font-bold text-slate-500 leading-tight">No staff assigned to this role.</p></div>
                            ) : usersInRole.map(user => (
                                <button key={user.user_id} onClick={() => setSelectedAuditUser(user)} className={`p-4 rounded-2xl text-left transition-all flex items-center gap-3 border ${selectedAuditUser?.user_id === user.user_id ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm' : 'hover:bg-slate-50 border-transparent text-slate-600'}`}>
                                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0"><User size={14} className={selectedAuditUser?.user_id === user.user_id ? 'text-blue-600' : 'text-slate-400'}/></div>
                                    <div className="truncate">
                                        <p className="font-black text-xs uppercase truncate">{user.full_name}</p>
                                        <p className="text-[9px] font-bold opacity-60 truncate">{user.email}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight truncate">{selectedAuditUser ? `${selectedAuditUser.full_name}'s Clearances` : `${selectedRole.replace('_', ' ')} Clearances`}</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{selectedAuditUser ? `Inherited via the ${selectedRole.replace('_', ' ')} role` : 'Role-level privileges'}</p>
                            </div>
                            
                            <div className="flex items-center gap-3 shrink-0">
                                {/* NEW: DELETE CUSTOM ROLE BUTTON */}
                                {!baseRoles.includes(selectedRole) && (
                                    <button onClick={handleDeleteRole} className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Delete Role">
                                        <Trash2 size={16}/>
                                    </button>
                                )}
                                <button onClick={savePrivileges} disabled={isSaving} className="bg-purple-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] shadow-lg shadow-purple-200 hover:bg-purple-700 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50">
                                    {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} {isSaving ? 'Deploying...' : 'Save Updates'}
                                </button>
                            </div>
                        </div>

                        <div className="p-8 grid grid-cols-1 xl:grid-cols-2 gap-5 overflow-y-auto custom-scrollbar">
                            {Object.entries(systemPrivileges).map(([key, label]) => {
                                const isGranted = privileges[selectedRole]?.[key] || false;
                                return (
                                    <div key={key} onClick={() => handleToggle(key)} className={`p-5 rounded-[24px] border cursor-pointer transition-all flex items-center justify-between group ${isGranted ? 'bg-white border-purple-200 shadow-sm hover:border-purple-400' : 'bg-slate-50 border-slate-200 opacity-60 hover:opacity-100'}`}>
                                        <div>
                                            <p className={`font-black text-sm uppercase tracking-tight ${isGranted ? 'text-slate-800' : 'text-slate-500'}`}>{label}</p>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{isGranted ? 'Access Granted' : 'Restricted'}</p>
                                        </div>
                                        <div className={`transition-colors duration-300 ${isGranted ? 'text-purple-600' : 'text-slate-300 group-hover:text-slate-400'}`}>
                                            {isGranted ? <ToggleRight size={36} strokeWidth={1.5} /> : <ToggleLeft size={36} strokeWidth={1.5} />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div className="p-4 bg-amber-50 border-t border-amber-100 flex items-center gap-3">
                            <AlertCircle size={16} className="text-amber-600 shrink-0"/>
                            <p className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">
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