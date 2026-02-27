import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db';
import { Users, CalendarDays, CheckSquare, Clock, Plus, Trash2 } from 'lucide-react';
import './Dashboard.css';

export function Dashboard() {
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const studentsCount = useLiveQuery(() => db.students.count()) || 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const lessonsThisWeek = useLiveQuery(() =>
        db.lessons.where('date').between(startOfWeek, endOfWeek).count()
    ) || 0;

    const upcomingLessons = useLiveQuery(async () => {
        const scheduled = await db.lessons.where('status').equals('scheduled').toArray();
        const validLessons = scheduled
            .filter(lesson => new Date(lesson.date) >= today)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 5);

        // Fetch associated student names
        return Promise.all(validLessons.map(async (lesson) => {
            const student = await db.students.get(lesson.studentId);
            return { ...lesson, student };
        }));
    }, []) || [];

    const todos = useLiveQuery(() => db.todos.filter(todo => !todo.isCompleted).toArray()) || [];

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // You could plug in a toast notification here
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;
        await db.todos.add({
            title: newTaskTitle,
            isCompleted: false,
            urgency: 'high'
        });
        setNewTaskTitle('');
    };

    return (
        <div className="dashboard-container animate-fade-in">
            <header className="page-header">
                <h1>Overview</h1>
                <p className="subtitle">Welcome back! Here's your tutoring summary.</p>
            </header>

            <section className="metrics-grid">
                <div className="metric-card">
                    <div className="metric-icon users"><Users size={24} /></div>
                    <div className="metric-content">
                        <h3>Total Active Students</h3>
                        <span className="metric-value">{studentsCount}</span>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon calendar"><CalendarDays size={24} /></div>
                    <div className="metric-content">
                        <h3>Lessons This Week</h3>
                        <span className="metric-value">{lessonsThisWeek}</span>
                    </div>
                </div>
            </section>

            <div className="dashboard-grid">
                <section className="dashboard-section upcoming-schedule">
                    <div className="section-header">
                        <h2>Upcoming Schedule</h2>
                    </div>
                    <div className="card-list">
                        {upcomingLessons.length === 0 ? (
                            <p className="empty-state">No upcoming lessons scheduled.</p>
                        ) : upcomingLessons.map((lesson) => (
                            <div key={lesson.id} className="schedule-card">
                                <div className="schedule-time">
                                    <Clock size={16} />
                                    <span>{new Date(lesson.date).toLocaleDateString()}</span>
                                    <span>{new Date(lesson.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="schedule-details">
                                    <h4>{lesson.student?.name || 'Unknown Student'}</h4>
                                    <div className="location-row">
                                        <span className="location-text">{lesson.student?.location}</span>
                                        <button
                                            className="copy-btn"
                                            onClick={() => copyToClipboard(lesson.student?.location || '')}
                                            title="Copy Location"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                    {lesson.topicsForNext && (
                                        <p className="next-topics"><strong>Prep:</strong> {lesson.topicsForNext}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="dashboard-section global-todos">
                    <div className="section-header">
                        <h2>Urgent Tasks</h2>
                    </div>

                    <form onSubmit={handleAddTask} className="add-todo-inline" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                        <input
                            type="text"
                            placeholder="Add a new urgent task..."
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            style={{ flex: 1, padding: '10px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                        />
                        <button type="submit" className="btn-primary" disabled={!newTaskTitle.trim()} style={{ padding: '10px 16px' }}>
                            <Plus size={20} />
                        </button>
                    </form>

                    <div className="card-list">
                        {todos.length === 0 ? (
                            <p className="empty-state">All caught up!</p>
                        ) : todos.map((todo) => (
                            <div key={todo.id} className={`todo-card urgency-${todo.urgency}`}>
                                <button
                                    className="todo-check"
                                    onClick={() => db.todos.update(todo.id!, { isCompleted: true })}
                                >
                                    <CheckSquare size={20} />
                                </button>
                                <div className="todo-content">
                                    <p>{todo.title}</p>
                                </div>
                                <button
                                    className="todo-delete btn-icon"
                                    onClick={() => db.todos.delete(todo.id!)}
                                    title="Delete Task"
                                    style={{ marginLeft: 'auto', color: 'var(--text-tertiary)' }}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
