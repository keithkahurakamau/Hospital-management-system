import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, CalendarDays, UserSquare, 
  BedDouble, CreditCard, FileClock, Pill, FlaskConical, BarChart3, Settings 
} from 'lucide-react';
import '../styles/Layout.css';

const Layout = ({ children }) => {
  const location = useLocation();
  
  const menuItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={18}/> },
    { path: '/patients', label: 'Patients', icon: <Users size={18}/> },
    { path: '/appointments', label: 'Appointments', icon: <CalendarDays size={18}/> },
    { path: '/doctors', label: 'Doctors & Staff', icon: <UserSquare size={18}/> },
    { path: '/beds', label: 'Bed Management', icon: <BedDouble size={18}/> },
    { path: '/billing', label: 'Billing', icon: <CreditCard size={18}/> },
    { path: '/records', label: 'Medical Records', icon: <FileClock size={18}/> },
    { path: '/pharmacy', label: 'Pharmacy', icon: <Pill size={18}/> },
    { path: '/lab', label: 'Laboratory', icon: <FlaskConical size={18}/> },
    { path: '/reports', label: 'Reports', icon: <BarChart3 size={18}/> },
    { path: '/settings', label: 'Settings', icon: <Settings size={18}/> },
  ];

  return (
    <div className="flex h-screen bg-[#f4f7fe] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">M</div>
          <h1 className="text-xl font-bold text-[#1B2559]">Medicare</h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                location.pathname === item.path 
                ? 'bg-blue-50 text-blue-600 font-bold' 
                : 'text-[#A3AED0] hover:bg-slate-50'
              }`}
            >
              {item.icon}
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-transparent flex items-center justify-between px-8">
          <div className="text-sm font-medium text-[#707EAE]">Pages / {location.pathname === '/' ? 'Dashboard' : 'Details'}</div>
          <div className="bg-white rounded-full px-4 py-2 shadow-sm border border-slate-100 flex items-center gap-4">
             <input type="text" placeholder="Search..." className="bg-slate-50 rounded-full px-4 py-1 text-sm outline-none w-48" />
             <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">JD</div>
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