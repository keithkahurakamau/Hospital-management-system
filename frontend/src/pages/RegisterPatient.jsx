import React, { useState } from 'react';
import api from '../api/axiosConfig';

const RegisterPatient = () => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        date_of_birth: '',
        gender: '',
        phone: '',
        email: '',
        address: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/patients/', formData);
            alert("Patient registered successfully!");
            // Reset form
            setFormData({ first_name: '', last_name: '', date_of_birth: '', gender: '', phone: '', email: '', address: '' });
        } catch (error) {
            alert("Registration failed: " + (error.response?.data?.detail || "Check server connection"));
        }
    };

    return (
        <div className="registration-container">
            <h3>New Patient Registration</h3>
            <form onSubmit={handleSubmit} className="staff-form">
                <input type="text" placeholder="First Name" required 
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})} value={formData.first_name} />
                
                <input type="text" placeholder="Last Name" required 
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})} value={formData.last_name} />
                
                <input type="date" required 
                    onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})} value={formData.date_of_birth} />
                
                <select onChange={(e) => setFormData({...formData, gender: e.target.value})} value={formData.gender}>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                </select>

                <input type="email" placeholder="Email" required 
                    onChange={(e) => setFormData({...formData, email: e.target.value})} value={formData.email} />

                <input type="text" placeholder="Phone Number" 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})} value={formData.phone} />

                <textarea placeholder="Address" 
                    onChange={(e) => setFormData({...formData, address: e.target.value})} value={formData.address} />

                <button type="submit" className="btn-primary">Finalize Registration</button>
            </form>
        </div>
    );
};

export default RegisterPatient;