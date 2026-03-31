import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { 
    Calendar, Clock, User, Stethoscope, 
    CheckCircle2, XCircle, CalendarPlus, Loader2 
} from 'lucide-react';

const Appointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [newAppt, setNewAppt] = useState({
        patient_id: '',
        doctor_id: '',
        appointment_date: '',
        appointment_time: '',
        notes: ''
    });

    const loadData = async () => {
        try {
            const [apptRes, patRes, docRes] = await Promise.all([
                api.get('/appointments/'),
                api.get('/patients/'),
                api.get('/users/') 
            ]);
            setAppointments(apptRes.data || []);
            setPatients(patRes.data || []);
            // Filter staff list for Doctors only
            setDoctors(docRes.data.filter(u => u.role === 'DOCTOR') || []);
        } catch (err) {
            console.error("Data aggregation failure", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleSchedule = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const dateTimeStr = `${newAppt.appointment_date}T${newAppt.appointment_time}:00Z`;
        
        try {
            await api.post('/appointments/', {
                patient_id: parseInt(newAppt.patient_id),
                doctor_id: parseInt(newAppt.doctor_id),
                appointment_date: dateTimeStr,
                notes: newAppt.notes
            });
            setNewAppt({ patient_id: '', doctor_id: '', appointment_date: '', appointment_time: '', notes: '' });
            await loadData();
        } catch (err) {
            alert("Failed to schedule appointment.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const mutateStatus = async (id, status) => {
        try {
            await api.patch(`/appointments/${id}/status?status=${status}`);
            loadData();
        } catch (err) {
            alert("Failed to update status.");
        }
    };

    if (loading) return <div className="flex h-[85vh] items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40}/></div>;

    return (
        <div className="w-full max-w-[1400px] mx-auto min-h-[85vh] flex flex-col gap-4 lg:gap-6 font-sans animate-in fade-in duration-500">
            
            {/* Header */}
            <div className="bg-white p-5 lg:p-8 rounded-[24px] lg:rounded-[32px] border border-slate-200 shadow-sm shrink-0">
                <h1 className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2 lg:gap-3">
                    <Calendar className="text-blue-600 lg:w-8 lg:h-8" size={24}/> Scheduling & Allocations
                </h1>
                <p className="text-slate-500 font-medium text-xs lg:text-sm mt-1 lg:mt-2">Manage patient bookings and physician assignments.</p>
            </div>

            {/* Grid Layout (Stacks on mobile automatically) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 flex-1">
                
                {/* FORM */}
                <div className="lg:col-span-1">
                    <form onSubmit={handleSchedule} className="bg-white p-5 lg:p-8 rounded-[24px] lg:rounded-[32px] border border-slate-200 shadow-sm space-y-4 lg:space-y-5">
                        <h3 className="text-lg lg:text-xl font-black text-slate-800 flex items-center gap-2 mb-2 lg:mb-4">
                            <CalendarPlus size={20} className="text-blue-600 lg:w-6 lg:h-6"/> New Booking
                        </h3>
                        
                        <div className="space-y-3 lg:space-y-4">
                            <div className="space-y-1.5 lg:space-y-2">
                                <label className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Patient</label>
                                <select 
                                    required className="w-full px-3 lg:px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl lg:rounded-2xl outline-none text-xs lg:text-sm font-bold text-slate-700 focus:border-blue-400"
                                    value={newAppt.patient_id} 
                                    onChange={e => setNewAppt({...newAppt, patient_id: e.target.value})}
                                >
                                    <option value="" disabled>Select Patient...</option>
                                    {patients.map(p => (
                                        <option key={p.patient_id || p.id} value={p.patient_id || p.id}>
                                            {p.surname} {p.other_names}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5 lg:space-y-2">
                                <label className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Physician</label>
                                <select 
                                    required className="w-full px-3 lg:px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl lg:rounded-2xl outline-none text-xs lg:text-sm font-bold text-slate-700 focus:border-blue-400"
                                    value={newAppt.doctor_id} 
                                    onChange={e => setNewAppt({...newAppt, doctor_id: e.target.value})}
                                >
                                    <option value="" disabled>Select Doctor...</option>
                                    {doctors.map(d => <option key={d.user_id} value={d.user_id}>Dr. {d.full_name}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3 lg:gap-4">
                                <input type="date" required className="w-full px-3 lg:px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl lg:rounded-2xl text-xs lg:text-sm font-bold"
                                    value={newAppt.appointment_date} onChange={e => setNewAppt({...newAppt, appointment_date: e.target.value})} />
                                <input type="time" required className="w-full px-3 lg:px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl lg:rounded-2xl text-xs lg:text-sm font-bold"
                                    value={newAppt.appointment_time} onChange={e => setNewAppt({...newAppt, appointment_time: e.target.value})} />
                            </div>

                            <button type="submit" disabled={isSubmitting} className="w-full py-3.5 lg:py-4 mt-2 bg-blue-600 text-white rounded-xl lg:rounded-2xl font-black text-[10px] lg:text-xs uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                                {isSubmitting ? <Loader2 className="animate-spin" size={16}/> : 'Commit Allocation'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* LIST */}
                <div className="lg:col-span-2 bg-white rounded-[24px] lg:rounded-[32px] border border-slate-200 shadow-sm flex flex-col overflow-hidden min-h-[500px]">
                    <div className="p-5 lg:p-8 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-lg lg:text-xl font-black text-slate-800">Master Schedule</h3>
                    </div>
                    
                    <div className="p-4 lg:p-8 flex-1 overflow-y-auto space-y-3 lg:space-y-4 custom-scrollbar">
                        {appointments.length === 0 ? (
                            <div className="text-center py-16 text-slate-400 font-bold text-sm">No appointments found.</div>
                        ) : (
                            appointments.map(appt => (
                                <div key={appt.id} className="p-4 lg:p-5 bg-white border border-slate-200 rounded-[20px] lg:rounded-[24px] flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 shadow-sm hover:border-slate-300 transition-colors">
                                    <div>
                                        <div className="flex flex-wrap gap-2 mb-2 lg:mb-3">
                                            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-[9px] lg:text-[10px] font-black uppercase tracking-widest">
                                                {appt.date} @ {appt.time}
                                            </span>
                                            <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded-md text-[9px] lg:text-[10px] font-black uppercase tracking-widest">
                                                {appt.status}
                                            </span>
                                        </div>
                                        <p className="text-base lg:text-lg font-black text-slate-800 flex items-center gap-2">
                                            <User size={16} className="text-slate-400 lg:w-[18px] lg:h-[18px]"/> {appt.patient_name}
                                        </p>
                                        <p className="text-xs lg:text-sm font-bold text-slate-500 flex items-center gap-2 mt-1">
                                            <Stethoscope size={14} className="text-slate-400 lg:w-[16px] lg:h-[16px]"/> {appt.doctor_name}
                                        </p>
                                    </div>
                                    
                                    {appt.status === 'Scheduled' && (
                                        <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                            <button 
                                                onClick={() => mutateStatus(appt.id, 'Completed')} 
                                                className="flex-1 sm:flex-none flex items-center justify-center p-2.5 lg:p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"
                                                title="Mark Completed"
                                            >
                                                <CheckCircle2 size={18} className="lg:w-5 lg:h-5"/>
                                            </button>
                                            <button 
                                                onClick={() => mutateStatus(appt.id, 'Cancelled')} 
                                                className="flex-1 sm:flex-none flex items-center justify-center p-2.5 lg:p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                                                title="Cancel Appointment"
                                            >
                                                <XCircle size={18} className="lg:w-5 lg:h-5"/>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Appointments;