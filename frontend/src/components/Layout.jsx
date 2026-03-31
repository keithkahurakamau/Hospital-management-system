import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { 
  LayoutDashboard, Users, UserRound, FileClock, ShieldCheck, 
  CreditCard, Pill, FlaskConical, LogOut, Activity, Search, CalendarDays, PackageSearch, BedDouble, Menu, X
} from 'lucide-react';

const Layout = ({ children, setIsAuthenticated }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  
  const userRole = sessionStorage.getItem('userRole'); 
  const userId = sessionStorage.getItem('userId'); 
  const userName = sessionStorage.getItem('userName') || 'Staff';

  const fetchPermissions = useCallback(async () => {
    try {
        const res = await api.get('/users/me/permissions/');
        setPermissions(res.data.permissions);
    } catch (err) {
        console.error("Permission sync failed", err);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
    if (!userId) return;

    const socket = new WebSocket(`ws://localhost:8000/ws/notifications/${userId}`);
    
    socket.onopen = () => console.log("🟢 WebSocket Connected Successfully!");
    
    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'REFRESH_PERMISSIONS') {
            console.log("⚡ INCOMING SIGNAL: Admin updated privileges. Refreshing UI...");
            fetchPermissions();
        }
    };

    return () => {
        if (socket.readyState === WebSocket.OPEN) socket.close();
    };
  }, [userId, fetchPermissions]);

  useEffect(() => {
      setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
      sessionStorage.clear(); 
      setIsAuthenticated(false);
      navigate('/login');
  };

  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, public: true },
    { path: '/inventory', label: 'Inventory', icon: PackageSearch, perm: 'manage_stock' }, 
    { path: '/appointments', label: 'Appointments', icon: CalendarDays, perm: 'manage_appointments' },
    { path: '/patients', label: 'Patient Registry', icon: UserRound, perm: 'register_patients' },
    { path: '/beds', label: 'Bed Management', icon: BedDouble, perm: 'manage_beds' }, 
    { path: '/billing', label: 'Financial Ledger', icon: CreditCard, perm: 'view_financials' },
    { path: '/pharmacy', label: 'Pharmacy POS', icon: Pill, perm: 'manage_inventory' },
    { path: '/records', label: 'Clinical Desk', icon: FileClock, perm: 'consult_patients' },
    { path: '/lab', label: 'Laboratory', icon: FlaskConical, perm: 'manage_labs' },
    { path: '/users', label: 'Access Control', icon: ShieldCheck, perm: 'manage_users' },
  ];

  const filteredMenu = menuItems.filter(item => 
    item.public || permissions[item.perm] === true || userRole === 'ADMIN'
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans relative">
      
      {/* MOBILE OVERLAY */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* SIDEBAR (Responsive) 
        NOTE: Added `lg:z-0` so the sidebar sits properly in the background on desktop
      */}
      <aside className={`fixed inset-y-0 left-0 z-50 lg:z-0 w-72 bg-white border-r border-slate-200 flex flex-col justify-between shadow-2xl lg:shadow-sm transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div>
            <div className="p-6 lg:p-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-white shadow-lg"><Activity size={22} /></div>
                    <h1 className="text-xl font-black text-slate-800 tracking-tight">Medicare</h1>
                </div>
                {/* Mobile Close Button */}
                <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-2 text-slate-400 hover:bg-slate-100 rounded-xl"><X size={20}/></button>
            </div>
            <nav className="px-4 space-y-1 overflow-y-auto max-h-[calc(100vh-250px)] custom-scrollbar">
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
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-800 font-black text-xs border border-slate-200 shadow-sm shrink-0">{getInitials(userName)}</div>
                <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-black text-slate-800 truncate uppercase">{userName}</p>
                    <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase tracking-widest mt-1 inline-block truncate max-w-full">{userRole}</span>
                </div>
            </div>
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all text-xs font-black">
                <LogOut size={16} /> SIGN OUT
            </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA 
        NOTE: Added `relative z-10` to elevate main content above the sidebar on desktop 
      */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        <header className="h-16 lg:h-20 flex items-center justify-between px-4 lg:px-8 bg-transparent shrink-0">
          <div className="flex items-center gap-3">
              {/* MOBILE MENU TRIGGER */}
              <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 bg-white border border-slate-200 rounded-xl text-slate-600 shadow-sm hover:bg-slate-50 transition-colors">
                  <Menu size={20}/>
              </button>
              <div className="text-[10px] lg:text-[11px] font-black text-slate-400 uppercase tracking-widest truncate">
                {userRole} / {location.pathname === '/' ? 'Home' : location.pathname.substring(1)}
              </div>
          </div>
        </header>
        <section className="flex-1 overflow-y-auto p-4 lg:p-8 pt-0 custom-scrollbar">
          <div className="animate-in fade-in duration-500 w-full h-full">{children}</div>
        </section>
      </main>
    </div>
  );
};

export default Layout;