import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

// Import our active pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import MedicalRecords from './pages/MedicalRecords';
import Billing from './pages/Billing';
import PharmacyPOS from './pages/PharmacyPOS'; 
import Beds from './pages/Beds'; 
import Laboratory from './pages/Laboratory';
import Reports from './pages/Reports';
import Appointments from './pages/Appointments';
import Doctors from './pages/Doctors';

const ComingSoon = ({ moduleName }) => (
  <div className="flex flex-col items-center justify-center h-[60vh] text-[#A3AED0]">
    <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
      <span className="text-4xl">🚧</span>
    </div>
    <h2 className="text-2xl font-bold text-[#1B2559] mb-2">{moduleName} Module</h2>
    <p className="font-medium">This sector of the Medicare system is currently under construction.</p>
  </div>
);

function App() {
    // Check if user is already logged in from a previous session
    const [isAuthenticated, setIsAuthenticated] = useState(
        !!localStorage.getItem('userRole')
    );

    const handleLoginSuccess = () => {
        setIsAuthenticated(true);
    };

    // If not authenticated, ONLY render the Login page. 
    // They cannot access the Layout sidebar or any internal routes.
    if (!isAuthenticated) {
        return <Login onLoginSuccess={handleLoginSuccess} />;
    }

    // If authenticated, render the full application inside the Layout
    return (
        <Router>
            <Layout setIsAuthenticated={setIsAuthenticated}>
                <Routes>
                    {/* Active Routes */}
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/patients" element={<Patients />} />
                    <Route path="/records" element={<MedicalRecords />} />
                    <Route path="/billing" element={<Billing />} />
                    <Route path="/pharmacy" element={<PharmacyPOS />} /> 
                    <Route path="/beds" element={<Beds />} /> 
                    <Route path="/lab" element={<Laboratory />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/appointments" element={<Appointments />} />
                    <Route path="/doctors" element={<Doctors />} />
                    
                    {/* Placeholder Routes */}
                    <Route path="/settings" element={<ComingSoon moduleName="System Settings" />} />
                    
                    {/* Catch-all redirect */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Layout>
        </Router>
    );
}

export default App;