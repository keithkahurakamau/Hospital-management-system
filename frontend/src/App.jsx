import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientProfile from './pages/PatientProfile';
import ClinicalDesk from './pages/ClinicalDesk'; 
import Billing from './pages/Billing';
import Pharmacy from './pages/Pharmacy'; 
import Beds from './pages/Beds'; 
import Laboratory from './pages/Laboratory';
import Reports from './pages/Reports';
import Appointments from './pages/Appointments';
import UserManagement from './pages/UserManagement'; 
import Inventory from './pages/Inventory';
import AdminPricing from './pages/AdminPricing';

function App() {
    // CHECKING SESSION STORAGE INSTEAD OF LOCAL
    const [isAuthenticated, setIsAuthenticated] = useState(!!sessionStorage.getItem('token'));

    const handleLoginSuccess = () => {
        setIsAuthenticated(true);
    };

    return (
        <Router>
            <Routes>
                {/* PUBLIC ROUTE: Login */}
                <Route 
                    path="/login" 
                    element={
                        !isAuthenticated 
                            ? <Login onLoginSuccess={handleLoginSuccess} /> 
                            : <Navigate to="/" replace />
                    } 
                />

                {/* PROTECTED ROUTES: Requires Authentication */}
                <Route 
                    path="/*" 
                    element={
                        isAuthenticated ? (
                            <Layout setIsAuthenticated={setIsAuthenticated}>
                                <Routes>
                                    <Route path="/" element={<Dashboard />} />
                                    <Route path="/patients" element={<Patients />} />
                                    <Route path="/patients/:id" element={<PatientProfile />} /> 
                                    
                                    <Route path="/billing" element={<Billing />} />
                                    <Route path="/appointments" element={<Appointments />} />
                                    <Route path="/beds" element={<Beds />} />
                                    
                                    {/* Role Specific Components */}
                                    <Route path="/records" element={<ClinicalDesk />} /> 
                                    <Route path="/lab" element={<Laboratory />} />
                                    <Route path="/pharmacy" element={<Pharmacy/>} />
                                    <Route path="/inventory" element={<Inventory />} />
                                    <Route path="/users" element={<UserManagement />} />
                                    <Route path="/reports" element={<Reports />} />
                                    <Route path="/admin/pricing" element={<AdminPricing />} />
                                    {/* Catch-all redirect to Dashboard */}
                                    <Route path="*" element={<Navigate to="/" replace />} />
                                </Routes>
                            </Layout>
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    } 
                />
            </Routes>
        </Router>
    );
}

export default App;