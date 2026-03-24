import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, CalendarDays, UserSquare, 
  BedDouble, CreditCard, FileClock, Pill, FlaskConical, BarChart3, Settings, LogOut, Activity, Search
} from 'lucide-react';
import '../styles/Layout.css';

const Layout = ({ children, setIsAuthenticated }) => {
  const location = useLocation();
  
  // Retrieve the current user's session data
  const userRole = localStorage.getItem('userRole') || 'DOCTOR';
  const userName = localStorage.getItem('userName') || 'System User';

  const handleLogout = () => {
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      if (setIsAuthenticated) setIsAuthenticated(false);
  };

  // Extract initials for the avatar (e.g., "Front Desk" -> "FD")
  const getInitials = (name) => {
      return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // Define the menu with Role-Based Access Control (RBAC) tags
  const menuItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={18}/>, roles: ['DOCTOR', 'SECRETARY'] },
    { path: '/patients', label: 'Patients', icon: <Users size={18}/>, roles: ['DOCTOR', 'SECRETARY'] },
    { path: '/appointments', label: 'Appointments', icon: <CalendarDays size={18}/>, roles: ['DOCTOR', 'SECRETARY'] },
    { path: '/billing', label: 'Billing', icon: <CreditCard size={18}/>, roles: ['DOCTOR', 'SECRETARY'] },
    { path: '/pharmacy', label: 'Pharmacy', icon: <Pill size={18}/>, roles: ['DOCTOR', 'SECRETARY'] },
    { path: '/beds', label: 'Bed Management', icon: <BedDouble size={18}/>, roles: ['DOCTOR', 'SECRETARY'] },
    
    // Strictly Clinical / Admin Modules (Hidden from Secretary)
    { path: '/records', label: 'Medical Records', icon: <FileClock size={18}/>, roles: ['DOCTOR'] },
    { path: '/lab', label: 'Laboratory', icon: <FlaskConical size={18}/>, roles: ['DOCTOR'] }, 
    { path: '/doctors', label: 'Doctors & Staff', icon: <UserSquare size={18}/>, roles: ['DOCTOR'] },
    { path: '/reports', label: 'Financial Reports', icon: <BarChart3 size={18}/>, roles: ['DOCTOR'] },
    
    { path: '/settings', label: 'Settings', icon: <Settings size={18}/>, roles: ['DOCTOR', 'SECRETARY'] },
  ];

  // Dynamically filter the sidebar based on the logged-in role
  const filteredMenu = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="flex h-screen bg-[#f4f7fe] overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between">
        <div>
            {/* Brand Header */}
            <div className="p-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                <Activity size={18} />
            </div>
            <h1 className="text-xl font-bold text-[#1B2559]">Medicare</h1>
            </div>
            
            {/* Navigation Menu */}
            <nav className="px-4 space-y-1 overflow-y-auto">
            {filteredMenu.map((item) => (
                <Link 
                key={item.path} 
                to={item.path} 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                    location.pathname === item.path 
                    ? 'bg-blue-50 text-blue-600 shadow-sm' 
                    : 'text-[#A3AED0] hover:bg-slate-50 hover:text-slate-600'
                }`}
                >
                {item.icon}
                <span className="text-sm">{item.label}</span>
                </Link>
            ))}
            </nav>
        </div>

        {/* User Profile & Logout Bottom Section */}
        <div className="p-4 border-t border-slate-100 m-4 bg-slate-50 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm border border-blue-200">
                    {getInitials(userName)}
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-bold text-[#1B2559] truncate">{userName}</p>
                    <p className="text-xs font-medium text-[#A3AED0] truncate">{userRole}</p>
                </div>
            </div>
            <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all text-sm font-bold shadow-sm"
            >
                <LogOut size={16} /> Sign Out
            </button>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-transparent flex items-center justify-between px-8">
          <div className="text-sm font-medium text-[#707EAE] capitalize">
            Pages / {location.pathname === '/' ? 'Dashboard' : location.pathname.substring(1)}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-white rounded-full px-4 py-2 shadow-sm border border-slate-100 flex items-center gap-2">
                <Search size={16} className="text-slate-400" />
                <input type="text" placeholder="Global search..." className="bg-transparent text-sm outline-none w-48 text-slate-600" />
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-8 pt-0">
          {children}
        </section>
      </main>
    </div>
  );
};

export default Layout;