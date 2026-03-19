import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';

// Import our active pages
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import MedicalRecords from './pages/MedicalRecords';
import Billing from './pages/Billing';
import Pharmacy from './pages/Pharmacy';
import Beds from './pages/Beds'; // <-- 1. Added the Bed import
import Laboratory from './pages/Laboratory';
import Reports from './pages/Reports';
import Appointments from './pages/Appointments';
import Doctors from './pages/Doctors';
// A professional placeholder for modules we haven't built yet
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
    return (
        <Router>
            <Layout>
                <Routes>
                    {/* Active Routes */}
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/patients" element={<Patients />} />
                    <Route path="/records" element={<MedicalRecords />} />
                    <Route path="/billing" element={<Billing />} />
                    <Route path="/pharmacy" element={<Pharmacy />} />
                    <Route path="/beds" element={<Beds />} /> {/* <-- 2. Removed the placeholder! */}
                    <Route path="/lab" element={<Laboratory />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/appointments" element={<Appointments />} />
                    <Route path="/doctors" element={<Doctors />} />
                    {/* Placeholder Routes */}
                    
                    <Route path="/settings" element={<ComingSoon moduleName="System Settings" />} />
                </Routes>
            </Layout>
        </Router>
    );
}

export default App;