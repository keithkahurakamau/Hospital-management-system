import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
    return (
        <div className="sidebar">
            <h2 className="brand">HMS Core</h2>
            <nav>
                <Link to="/">Dashboard</Link>
                <Link to="/patients">Patient Registry</Link>
                <Link to="/doctors">Doctor Schedules</Link>
                <Link to="/appointments">Appointments</Link>
                <Link to="/billing">Billing & Finance</Link>
            </nav>
        </div>
    );
};

export default Sidebar;