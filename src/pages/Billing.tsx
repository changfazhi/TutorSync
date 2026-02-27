import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db';
import { CheckCircle, ClockAlert, DollarSign, WalletCards } from 'lucide-react';
import './Billing.css';

export function Billing() {
    const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid'>('all');

    // Fetch all lessons to calculate billing (parents might pay in advance for scheduled lessons)
    const allLessons = useLiveQuery(async () => {
        const lessons = await db.lessons.orderBy('date').reverse().toArray();
        const enriched = await Promise.all(lessons.map(async (lesson) => {
            const student = await db.students.get(lesson.studentId);
            return {
                ...lesson,
                student,
                cost: student ? student.hourlyRate * lesson.durationHours : 0
            };
        }));
        return enriched;
    }) || [];

    const filteredLessons = useMemo(() => {
        if (filter === 'all') return allLessons;
        return allLessons.filter(l => l.paymentStatus === filter);
    }, [allLessons, filter]);

    // Summarize Revenue
    const revenueStats = useMemo(() => {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        let totalUnpaid = 0;
        let thisMonthPaid = 0;

        allLessons.forEach(lesson => {
            const lessonDate = new Date(lesson.date);
            if (lesson.paymentStatus === 'unpaid' || lesson.paymentStatus === 'pending') {
                totalUnpaid += lesson.cost;
            } else if (lesson.paymentStatus === 'paid' && lessonDate.getMonth() === currentMonth && lessonDate.getFullYear() === currentYear) {
                thisMonthPaid += lesson.cost;
            }
        });

        return { totalUnpaid, thisMonthPaid };
    }, [allLessons]);

    const markAsPaid = async (lessonId: number) => {
        await db.lessons.update(lessonId, { paymentStatus: 'paid' });
    };

    return (
        <div className="billing-container animate-fade-in">
            <header className="page-header">
                <h1>Billing & Payments</h1>
                <p className="subtitle">Track revenue and manage outstanding payments.</p>
            </header>

            <section className="revenue-grid">
                <div className="revenue-card main">
                    <div className="revenue-icon"><WalletCards size={28} /></div>
                    <div className="revenue-details">
                        <h3>This Month's Revenue</h3>
                        <span className="revenue-amount">${revenueStats.thisMonthPaid.toFixed(2)}</span>
                    </div>
                </div>
                <div className="revenue-card outstanding">
                    <div className="revenue-icon pending"><ClockAlert size={28} /></div>
                    <div className="revenue-details">
                        <h3>Outstanding Payments</h3>
                        <span className="revenue-amount">${revenueStats.totalUnpaid.toFixed(2)}</span>
                    </div>
                </div>
            </section>

            <section className="billing-list-section">
                <div className="list-header">
                    <h2>Payment History</h2>
                    <div className="filter-group">
                        <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
                        <button className={`filter-btn ${filter === 'unpaid' ? 'active' : ''}`} onClick={() => setFilter('unpaid')}>Unpaid</button>
                        <button className={`filter-btn ${filter === 'paid' ? 'active' : ''}`} onClick={() => setFilter('paid')}>Paid</button>
                    </div>
                </div>

                <div className="table-container premium-panel">
                    {filteredLessons.length === 0 ? (
                        <div className="empty-state">No billing records found.</div>
                    ) : (
                        <table className="billing-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Student</th>
                                    <th>Duration</th>
                                    <th>Rate/Hr</th>
                                    <th>Total Cost</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLessons.map(lesson => (
                                    <tr key={lesson.id}>
                                        <td>{new Date(lesson.date).toLocaleDateString()}</td>
                                        <td className="font-semibold">{lesson.student?.name}</td>
                                        <td>{lesson.durationHours} hrs</td>
                                        <td>${lesson.student?.hourlyRate}</td>
                                        <td className="font-semibold">${lesson.cost.toFixed(2)}</td>
                                        <td>
                                            <span className={`status-badge ${lesson.paymentStatus}`}>
                                                {lesson.paymentStatus.toUpperCase()}
                                            </span>
                                        </td>
                                        <td>
                                            {lesson.paymentStatus !== 'paid' ? (
                                                <button
                                                    className="btn-sm btn-primary action-btn"
                                                    onClick={() => markAsPaid(lesson.id!)}
                                                >
                                                    <DollarSign size={14} /> Mark Paid
                                                </button>
                                            ) : (
                                                <span className="paid-icon"><CheckCircle size={18} /></span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </section>
        </div>
    );
}
