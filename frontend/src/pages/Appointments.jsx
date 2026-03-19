import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { Calendar, Clock, User, Stethoscope, CheckCircle, XCircle } from 'lucide-react';

const Appointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);

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
                api.get('/doctors/') // Assumes the doctor router was created during seeding
            ]);
            setAppointments(apptRes.data);
            setPatients(patRes.data);
            setDoctors(docRes.data);
        } catch (err) {
            console.error("Data aggregation failure", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleSchedule = async (e) => {
        e.preventDefault();
        
        // Construct ISO-8601 datetime string required by PostgreSQL/FastAPI
        const dateTimeStr = `${newAppt.appointment_date}T${newAppt.appointment_time}:00Z`;
        
        const payload = {
            patient_id: parseInt(newAppt.patient_id),
            doctor_id: parseInt(newAppt.doctor_id),
            appointment_date: dateTimeStr,
            notes: newAppt.notes
        };

        try {
            await api.post('/appointments/', payload);
            setNewAppt({ patient_id: '', doctor_id: '', appointment_date: '', appointment_time: '', notes: '' });
            loadData();
        } catch (err) {
            alert("Constraint violation: Failed to schedule.");
        }
    };

    const mutateStatus = async (id, status) => {
        try {
            await api.patch(`/appointments/${id}/status?status=${status}`);
            loadData();
        } catch (err) {
            console.error("Mutation failed");
        }
    };

    if (loading) return <div className="p-8 text-[#A3AED0]">Initializing Temporal Matrix...</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <header>
                <h2 className="text-2xl font-bold text-[#1B2559]">Scheduling & Allocations</h2>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Scheduling Input Vector */}
                <div className="lg:col-span-1">
                    <form onSubmit={handleSchedule} className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm space-y-4">
                        <h3 className="font-bold text-[#1B2559] mb-4">New Allocation</h3>
                        
                        <select required className="w-full p-3 bg-slate-50 rounded-xl outline-none border border-slate-100 text-sm"
                            value={newAppt.patient_id} onChange={e => setNewAppt({...newAppt, patient_id: e.target.value})}>
                            <option value="">Target Patient...</option>
                            {patients.map(p => <option key={p.patient_id} value={p.patient_id}>{p.first_name} {p.last_name}</option>)}
                        </select>

                        <select required className="w-full p-3 bg-slate-50 rounded-xl outline-none border border-slate-100 text-sm"
                            value={newAppt.doctor_id} onChange={e => setNewAppt({...newAppt, doctor_id: e.target.value})}>
                            <option value="">Assigned Physician...</option>
                            {doctors.map(d => <option key={d.doctor_id} value={d.doctor_id}>Dr. {d.last_name} ({d.specialization})</option>)}
                        </select>

                        <div className="grid grid-cols-2 gap-3">
                            <input type="date" required className="p-3 text-sm bg-slate-50 border border-slate-100 rounded-xl outline-none"
                                value={newAppt.appointment_date} onChange={e => setNewAppt({...newAppt, appointment_date: e.target.value})} />
                            <input type="time" required className="p-3 text-sm bg-slate-50 border border-slate-100 rounded-xl outline-none"
                                value={newAppt.appointment_time} onChange={e => setNewAppt({...newAppt, appointment_time: e.target.value})} />
                        </div>

                        <textarea placeholder="Clinical notes (optional)" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl h-20 outline-none text-sm"
                            value={newAppt.notes} onChange={e => setNewAppt({...newAppt, notes: e.target.value})} />

                        <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700">
                            Commit Allocation
                        </button>
                    </form>
                </div>

                {/* Master Schedule Output */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-50 shadow-sm">
                    <h3 className="text-lg font-bold text-[#1B2559] mb-4">Master Schedule</h3>
                    <div className="space-y-3">
                        {appointments.length === 0 && <p className="text-sm text-[#A3AED0]">Null set. No allocations detected.</p>}
                        
                        {appointments.map(appt => (
                            <div key={appt.id} className="p-4 border border-slate-100 bg-slate-50/50 rounded-2xl flex justify-between items-center">
                                <div>
                                    <div className="flex gap-4 mb-2">
                                        <span className="flex items-center gap-1 text-xs font-bold text-slate-500"><Calendar size={14}/> {appt.date}</span>
                                        <span className="flex items-center gap-1 text-xs font-bold text-blue-600"><Clock size={14}/> {appt.time}</span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                            appt.status === 'Scheduled' ? 'bg-blue-100 text-blue-700' :
                                            appt.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                        }`}>{appt.status}</span>
                                    </div>
                                    <p className="font-bold text-[#1B2559] flex items-center gap-2"><User size={16} className="text-[#A3AED0]"/> {appt.patient_name}</p>
                                    <p className="text-sm font-medium text-slate-600 flex items-center gap-2 mt-1"><Stethoscope size={16} className="text-[#A3AED0]"/> {appt.doctor_name}</p>
                                </div>
                                
                                {appt.status === 'Scheduled' && (
                                    <div className="flex flex-col gap-2">
                                        <button onClick={() => mutateStatus(appt.id, 'Completed')} className="flex items-center justify-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-bold rounded hover:bg-emerald-100">
                                            <CheckCircle size={14} /> Fulfill
                                        </button>
                                        <button onClick={() => mutateStatus(appt.id, 'Cancelled')} className="flex items-center justify-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded hover:bg-red-100">
                                            <XCircle size={14} /> Cancel
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Appointments;