import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { 
  LayoutDashboard, Users, UserRound, FileClock, ShieldCheck, 
  CreditCard, Pill, FlaskConical, LogOut, Activity, Search, CalendarDays
} from 'lucide-react';

const Layout = ({ children, setIsAuthenticated }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState({});
  
  // READING FROM SESSION STORAGE
  const userRole = sessionStorage.getItem('userRole'); 
  const userId = sessionStorage.getItem('userId'); 
  const userName = sessionStorage.getItem('userName') || 'Staff';

  const fetchPermissions = useCallback(async () => {
    try {
        const res = await api.get('/users/me/permissions');
        setPermissions(res.data.permissions);
    } catch (err) {
        console.error("Permission sync failed", err);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();

    if (!userId) return;

    console.log(`🔌 Attempting to connect WebSocket for User ID: ${userId}...`);
    const socket = new WebSocket(`ws://localhost:8000/ws/notifications/${userId}`);
    
    socket.onopen = () => {
        console.log("🟢 WebSocket Connected Successfully!");
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'REFRESH_PERMISSIONS') {
            console.log("⚡ INCOMING SIGNAL: Admin updated privileges. Refreshing UI...");
            fetchPermissions();
        }
    };

    socket.onerror = (error) => {
        // Suppress generic error
    };

    socket.onclose = () => {
        console.log("⚪ WebSocket Disconnected.");
    };

    return () => {
        if (socket.readyState === WebSocket.OPEN) {
            socket.close();
        }
    };
  }, [userId, fetchPermissions]);

  const handleLogout = () => {
      sessionStorage.clear(); // CLEARING SESSION STORAGE
      setIsAuthenticated(false);
      navigate('/login');
  };

  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, public: true },
    { path: '/appointments', label: 'Appointments', icon: CalendarDays, perm: 'manage_appointments' },
    { path: '/patients', label: 'Patient Registry', icon: UserRound, perm: 'register_patients' },
    { path: '/billing', label: 'Financial Ledger', icon: CreditCard, perm: 'view_financials' },
    { path: '/pharmacy', label: 'Pharmacy POS', icon: Pill, perm: 'manage_inventory' },
    { path: '/records', label: 'Medical Records', icon: FileClock, perm: 'consult_patients' },
    { path: '/lab', label: 'Laboratory', icon: FlaskConical, perm: 'manage_labs' },
    { path: '/users', label: 'Access Control', icon: ShieldCheck, perm: 'manage_users' },
  ];

  const filteredMenu = menuItems.filter(item => 
    item.public || permissions[item.perm] === true || userRole === 'ADMIN'
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col justify-between shadow-sm">
        <div>
            <div className="p-8 flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-white shadow-lg"><Activity size={22} /></div>
                <h1 className="text-xl font-black text-slate-800 tracking-tight">Medicare</h1>
            </div>
            <nav className="px-4 space-y-1 overflow-y-auto max-h-[calc(100vh-300px)] custom-scrollbar">
                {filteredMenu.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-bold text-sm ${isActive ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'}`}>
                            <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>

        <div className="p-4 border-t border-slate-100 m-4 bg-slate-50 rounded-[28px]">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-800 font-black text-xs border border-slate-200 shadow-sm">{getInitials(userName)}</div>
                <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-black text-slate-800 truncate uppercase">{userName}</p>
                    <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase tracking-widest mt-1 inline-block">{userRole}</span>
                </div>
            </div>
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all text-xs font-black">
                <LogOut size={16} /> SIGN OUT
            </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 flex items-center justify-between px-8 bg-transparent">
          <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
            {userRole} / {location.pathname === '/' ? 'Home' : location.pathname.substring(1)}
          </div>
        </header>
        <section className="flex-1 overflow-y-auto p-8 pt-0 custom-scrollbar">
          <div className="animate-in fade-in duration-500">{children}</div>
        </section>
      </main>
    </div>
  );
};

export default Layout;