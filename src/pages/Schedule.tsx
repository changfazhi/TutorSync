import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db';
import { Calendar, Clock, CheckCircle2, ChevronDown, PlusCircle, Trash2 } from 'lucide-react';
import './Schedule.css';

export function Schedule() {
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({
        studentId: '', date: '', time: '', durationHours: '1', topicsForNext: ''
    });
    const [editingLessonId, setEditingLessonId] = useState<number | null>(null);
    const [editFormData, setEditFormData] = useState({
        studentId: '', date: '', time: '', durationHours: '1', topicsForNext: ''
    });

    const students = useLiveQuery(() => db.students.toArray()) || [];

    // Fetch all scheduled lessons
    const scheduledLessons = useLiveQuery(async () => {
        const lessons = await db.lessons.where('status').equals('scheduled').sortBy('date');
        return Promise.all(lessons.map(async (lesson) => {
            const student = await db.students.get(lesson.studentId);
            return { ...lesson, student };
        }));
    }) || [];

    // Fetch past lessons
    const pastLessons = useLiveQuery(async () => {
        const lessons = await db.lessons.where('status').equals('past').reverse().sortBy('date');
        return Promise.all(lessons.slice(0, 10).map(async (lesson) => {
            const student = await db.students.get(lesson.studentId);
            return { ...lesson, student };
        }));
    }) || [];

    const handleOpenEdit = (lesson: any) => {
        const d = new Date(lesson.date);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');

        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');

        setEditFormData({
            studentId: lesson.studentId.toString(),
            date: `${yyyy}-${mm}-${dd}`,
            time: `${hh}:${min}`,
            durationHours: lesson.durationHours.toString(),
            topicsForNext: lesson.topicsForNext || ''
        });
        setEditingLessonId(lesson.id!);
        setShowAddForm(false);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingLessonId) return;

        const baseDate = new Date(`${editFormData.date}T${editFormData.time}`);

        await db.lessons.update(editingLessonId, {
            studentId: Number(editFormData.studentId),
            date: baseDate,
            topicsForNext: editFormData.topicsForNext,
            durationHours: Number(editFormData.durationHours)
        });

        setEditingLessonId(null);
    };

    const handleAddLesson = async (e: React.FormEvent) => {
        e.preventDefault();

        const baseDate = new Date(`${formData.date}T${formData.time}`);

        await db.lessons.add({
            studentId: Number(formData.studentId),
            date: baseDate,
            status: 'scheduled',
            paymentStatus: 'unpaid',
            topicsForNext: formData.topicsForNext,
            durationHours: Number(formData.durationHours)
        });

        setShowAddForm(false);
        setFormData({ studentId: '', date: '', time: '', durationHours: '1', topicsForNext: '' });
    };

    const markAsComplete = async (lessonId: number) => {
        const lesson = await db.lessons.get(lessonId);
        if (lesson) {
            await db.transaction('rw', db.lessons, async () => {
                await db.lessons.update(lessonId, { status: 'past' });

                // Automatically schedule the next class 1 week later
                const nextWeek = new Date(lesson.date);
                nextWeek.setDate(nextWeek.getDate() + 7);

                await db.lessons.add({
                    studentId: lesson.studentId,
                    date: nextWeek,
                    status: 'scheduled',
                    paymentStatus: 'unpaid',
                    durationHours: lesson.durationHours,
                    topicsForNext: '' // Clear topics for the next session
                });
            });
        }
    };

    const deleteLesson = async (lessonId: number) => {
        if (confirm('Are you sure you want to delete this lesson?')) {
            await db.lessons.delete(lessonId);
        }
    };

    return (
        <div className="schedule-container animate-fade-in">
            <header className="page-header with-actions">
                <div>
                    <h1>Lesson Schedule</h1>
                    <p className="subtitle">Manage upcoming sessions and log past lessons.</p>
                </div>
                <button className="btn-primary" onClick={() => { setShowAddForm(!showAddForm); setEditingLessonId(null); }}>
                    {showAddForm ? <ChevronDown size={18} /> : <PlusCircle size={18} />}
                    {showAddForm ? 'Close Form' : 'Schedule Lesson'}
                </button>
            </header>

            {editingLessonId && (
                <form onSubmit={handleEditSubmit} className="add-lesson-form premium-form">
                    <h3 style={{ marginBottom: '16px', fontSize: '1.125rem', color: 'var(--text-primary)' }}>Edit Lesson</h3>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Student</label>
                            <select required value={editFormData.studentId} onChange={e => setEditFormData({ ...editFormData, studentId: e.target.value })}>
                                <option value="" disabled>Select a student</option>
                                {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.subject})</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Date</label>
                            <input required type="date" value={editFormData.date} onChange={e => setEditFormData({ ...editFormData, date: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Time</label>
                            <input required type="time" value={editFormData.time} onChange={e => setEditFormData({ ...editFormData, time: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Duration (Hours)</label>
                            <input required type="number" step="0.5" min="0.5" value={editFormData.durationHours} onChange={e => setEditFormData({ ...editFormData, durationHours: e.target.value })} />
                        </div>
                        <div className="form-group full-width">
                            <label>Target Topics (Optional)</label>
                            <input type="text" placeholder="e.g. Intro to Differentiation" value={editFormData.topicsForNext} onChange={e => setEditFormData({ ...editFormData, topicsForNext: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-actions">
                        <button type="button" className="btn-secondary" onClick={() => setEditingLessonId(null)}>Cancel</button>
                        <button type="submit" className="btn-primary">Save Changes</button>
                    </div>
                </form>
            )}

            {showAddForm && !editingLessonId && (
                <form onSubmit={handleAddLesson} className="add-lesson-form premium-form">
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Student</label>
                            <select required value={formData.studentId} onChange={e => setFormData({ ...formData, studentId: e.target.value })}>
                                <option value="" disabled>Select a student</option>
                                {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.subject})</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Date</label>
                            <input required type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Time</label>
                            <input required type="time" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Duration (Hours)</label>
                            <input required type="number" step="0.5" min="0.5" value={formData.durationHours} onChange={e => setFormData({ ...formData, durationHours: e.target.value })} />
                        </div>
                        <div className="form-group full-width">
                            <label>Target Topics (Optional)</label>
                            <input type="text" placeholder="e.g. Intro to Differentiation" value={formData.topicsForNext} onChange={e => setFormData({ ...formData, topicsForNext: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="btn-primary">Add to Schedule</button>
                    </div>
                </form>
            )}

            <div className="schedule-split">
                <section className="schedule-section">
                    <h2>Upcoming Lessons</h2>
                    <div className="card-list">
                        {scheduledLessons.length === 0 ? (
                            <p className="empty-state">No upcoming lessons scheduled.</p>
                        ) : scheduledLessons.map(lesson => (
                            <div key={lesson.id} className="lesson-card" onClick={() => handleOpenEdit(lesson)} style={{ cursor: 'pointer' }}>
                                <div className="lesson-time">
                                    <Calendar size={18} />
                                    <strong>{new Date(lesson.date).toLocaleDateString()}</strong>
                                    <span className="time-text"><Clock size={14} /> {new Date(lesson.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="lesson-details">
                                    <h3>{lesson.student?.name}</h3>
                                    <span className="duration-badge">{lesson.durationHours} hrs</span>
                                    {lesson.topicsForNext && <p className="lesson-topic"><strong>Target:</strong> {lesson.topicsForNext}</p>}
                                </div>
                                <div className="lesson-actions">
                                    <button className="btn-icon complete-btn" onClick={(e) => { e.stopPropagation(); markAsComplete(lesson.id!); }} title="Log as Completed">
                                        <CheckCircle2 size={24} />
                                    </button>
                                    <button className="btn-icon delete-btn" onClick={(e) => { e.stopPropagation(); deleteLesson(lesson.id!); }} title="Delete Lesson" style={{ color: 'var(--danger)' }}>
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="schedule-section past-lessons">
                    <h2>Recent History</h2>
                    <div className="card-list">
                        {pastLessons.length === 0 ? (
                            <p className="empty-state">No past lessons logged.</p>
                        ) : pastLessons.map(lesson => (
                            <div key={lesson.id} className="lesson-card past" onClick={() => handleOpenEdit(lesson)} style={{ cursor: 'pointer' }}>
                                <div className="lesson-time">
                                    <strong>{new Date(lesson.date).toLocaleDateString()}</strong>
                                    <span className="time-text">{new Date(lesson.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="lesson-details">
                                    <h3>{lesson.student?.name} <span className="completed-badge">Completed</span></h3>
                                    {lesson.topicsForNext && <p className="lesson-topic">Covered: {lesson.topicsForNext}</p>}
                                </div>
                                <div className="lesson-actions">
                                    <button className="btn-icon delete-btn" onClick={(e) => { e.stopPropagation(); deleteLesson(lesson.id!); }} title="Delete Lesson" style={{ color: 'var(--danger)' }}>
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
