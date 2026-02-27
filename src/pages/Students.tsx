import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db';
import { Routes, Route, useNavigate, Link, useParams } from 'react-router-dom';
import { PlusCircle, Search, MapPin, Phone, GraduationCap, ChevronLeft, CalendarClock, Trash2 } from 'lucide-react';
import './Students.css';

function StudentList() {
    const [searchTerm, setSearchTerm] = useState('');
    const students = useLiveQuery(() => db.students.toArray()) || [];

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="students-container animate-fade-in">
            <header className="page-header with-actions">
                <div>
                    <h1>Students Directory</h1>
                    <p className="subtitle">Manage profiles and contact information.</p>
                </div>
                <Link to="/students/add" className="btn-primary">
                    <PlusCircle size={18} /> Add Student
                </Link>
            </header>

            <div className="search-bar">
                <Search size={20} className="search-icon" />
                <input
                    type="text"
                    placeholder="Search by name or subject..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="students-grid">
                {filteredStudents.length === 0 ? (
                    <p className="empty-state" style={{ gridColumn: '1 / -1' }}>No students found.</p>
                ) : filteredStudents.map(student => (
                    <Link to={`/students/${student.id}`} key={student.id} className="student-card">
                        <div className="card-header">
                            <h3>{student.name}</h3>
                            <span className="badge">{student.level}</span>
                        </div>
                        <div className="card-body">
                            <p><GraduationCap size={16} /> {student.subject}</p>
                            <p><Phone size={16} /> {student.parentContact}</p>
                            <p><MapPin size={16} /> {student.location}</p>
                        </div>
                        <div className="card-footer">
                            <strong>${student.hourlyRate}/hr</strong>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

function AddStudent() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '', parentContact: '', location: '', subject: '', level: '',
        examTopics: '', examDate: '', hourlyRate: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await db.students.add({
            ...formData,
            hourlyRate: Number(formData.hourlyRate),
            examDate: formData.examDate ? new Date(formData.examDate) : undefined,
            createdAt: new Date()
        });
        navigate('/students');
    };

    return (
        <div className="students-container animate-fade-in">
            <header className="page-header with-actions">
                <div>
                    <button onClick={() => navigate('/students')} className="btn-back">
                        <ChevronLeft size={20} /> Back
                    </button>
                    <h1>Add New Student</h1>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="premium-form">
                <div className="form-grid">
                    <div className="form-group">
                        <label>Student Name</label>
                        <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Parent/Guardian Contact</label>
                        <input required type="text" value={formData.parentContact} onChange={e => setFormData({ ...formData, parentContact: e.target.value })} />
                    </div>
                    <div className="form-group full-width">
                        <label>Tutoring Location</label>
                        <input required type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Subject</label>
                        <input required type="text" placeholder="e.g. H2 Mathematics" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Level</label>
                        <input required type="text" placeholder="e.g. A-Level" value={formData.level} onChange={e => setFormData({ ...formData, level: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Upcoming Exam Topics</label>
                        <input type="text" value={formData.examTopics} onChange={e => setFormData({ ...formData, examTopics: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Exam Date</label>
                        <input type="date" value={formData.examDate} onChange={e => setFormData({ ...formData, examDate: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Hourly Rate ($)</label>
                        <input required type="number" min="0" value={formData.hourlyRate} onChange={e => setFormData({ ...formData, hourlyRate: e.target.value })} />
                    </div>
                </div>
                <div className="form-actions">
                    <button type="button" onClick={() => navigate('/students')} className="btn-secondary">Cancel</button>
                    <button type="submit" className="btn-primary">Save Student</button>
                </div>
            </form>
        </div>
    );
}

function StudentProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const student = useLiveQuery(() => db.students.get(Number(id)));

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this student and all their data?')) {
            await db.transaction('rw', db.students, db.lessons, db.todos, async () => {
                await db.lessons.where('studentId').equals(Number(id)).delete();
                await db.todos.where('studentId').equals(Number(id)).delete();
                await db.students.delete(Number(id));
            });
            navigate('/students');
        }
    };

    if (!student) return <div className="students-container"><p>Loading profile...</p></div>;

    return (
        <div className="students-container animate-fade-in">
            <header className="page-header with-actions">
                <div>
                    <button onClick={() => navigate('/students')} className="btn-back">
                        <ChevronLeft size={20} /> Back
                    </button>
                    <h1>{student.name}</h1>
                    <p className="subtitle">{student.subject} • {student.level}</p>
                </div>
                <button onClick={handleDelete} className="btn-secondary" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                    <Trash2 size={18} /> Delete Student
                </button>
            </header>

            <div className="profile-grid">
                <section className="profile-card">
                    <h2>Demographics</h2>
                    <ul className="details-list">
                        <li><Phone size={18} /> <span>Contact: {student.parentContact}</span></li>
                        <li><MapPin size={18} /> <span>Location: {student.location}</span></li>
                        <li><span className="rate-badge">${student.hourlyRate}/hour</span></li>
                    </ul>
                </section>

                <section className="profile-card">
                    <h2>Academic Target</h2>
                    <ul className="details-list">
                        <li><CalendarClock size={18} /> <span><strong>Exam Date:</strong> {student.examDate ? new Date(student.examDate).toLocaleDateString() : 'N/A'}</span></li>
                        <li><strong>Topics:</strong> {student.examTopics || 'None specified'}</li>
                    </ul>
                </section>
            </div>
        </div>
    );
}

export function Students() {
    return (
        <Routes>
            <Route path="/" element={<StudentList />} />
            <Route path="/add" element={<AddStudent />} />
            <Route path="/:id" element={<StudentProfile />} />
        </Routes>
    );
}
