import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Award, TrendingUp, TrendingDown, GripHorizontal } from 'lucide-react';
import './Analytics.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

export function Analytics() {
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [testLabel, setTestLabel] = useState('');
    const [testScore, setTestScore] = useState('');

    const students = useLiveQuery(() => db.students.toArray()) || [];

    // To plot, we grab all *past* lessons that contain scoreLogs for the selected student
    const logsQuery = useLiveQuery(async () => {
        if (!selectedStudentId) return [];

        const pastLessons = await db.lessons
            .where('studentId').equals(Number(selectedStudentId))
            .filter(l => l.status === 'past' && !!l.scoreLogs && l.scoreLogs.length > 0)
            .sortBy('date');

        // Flatten logs across lessons, keeping temporal order
        let aggregatedLogs: { label: string, score: number, date: Date }[] = [];
        pastLessons.forEach(l => {
            l.scoreLogs!.forEach(log => {
                aggregatedLogs.push({
                    label: log.label,
                    score: parseFloat(log.score),
                    date: l.date
                });
            });
        });

        return aggregatedLogs;
    }, [selectedStudentId]) || [];

    const handleAddLog = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudentId || !testLabel || !testScore) return;

        // We can just append a 'mock' or 'score log' to the most recent lesson or create a dedicated past placeholder lesson.
        // For simplicity, we create a dummy 'past' lesson object just to hold this log if none exist today.
        await db.lessons.add({
            studentId: Number(selectedStudentId),
            date: new Date(),
            status: 'past',
            paymentStatus: 'paid', // Dummy
            durationHours: 0,
            scoreLogs: [{ label: testLabel, score: testScore }],
        });

        setTestLabel('');
        setTestScore('');
    };

    const chartData = useMemo(() => {
        return {
            labels: logsQuery.map(l => l.label),
            datasets: [
                {
                    label: 'Test Scores (%)',
                    data: logsQuery.map(l => l.score),
                    borderColor: '#4f46e5',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#4f46e5',
                },
            ],
        };
    }, [logsQuery]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
            },
        },
        scales: {
            y: {
                min: 0,
                max: 100,
                ticks: { stepSize: 20 }
            }
        }
    };

    const averageScore = useMemo(() => {
        if (logsQuery.length === 0) return 0;
        const sum = logsQuery.reduce((acc, curr) => acc + curr.score, 0);
        return (sum / logsQuery.length).toFixed(1);
    }, [logsQuery]);

    const trend = useMemo(() => {
        if (logsQuery.length < 2) return 'flat';
        const first = logsQuery[0].score;
        const last = logsQuery[logsQuery.length - 1].score;
        return last > first ? 'up' : last < first ? 'down' : 'flat';
    }, [logsQuery]);

    return (
        <div className="analytics-container animate-fade-in">
            <header className="page-header">
                <h1>Performance Analytics</h1>
                <p className="subtitle">Track metrics and visualize student progression.</p>
            </header>

            <div className="analytics-controls">
                <label className="select-label">Select Student:</label>
                <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="student-select"
                >
                    <option value="">-- Choose a student --</option>
                    {students.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.subject})</option>
                    ))}
                </select>
            </div>

            {selectedStudentId && (
                <div className="analytics-content">
                    <div className="chart-section premium-panel">
                        {logsQuery.length > 0 ? (
                            <div className="chart-wrapper">
                                <Line data={chartData} options={chartOptions} />
                            </div>
                        ) : (
                            <div className="empty-chart">
                                <Award size={48} className="empty-icon text-tertiary" />
                                <p>No score logs found for this student.</p>
                            </div>
                        )}
                    </div>

                    <div className="analytics-sidebar">
                        <div className="stats-card premium-panel">
                            <div className="stats-header">
                                <h3>Overall Average</h3>
                            </div>
                            <div className="stats-body">
                                <span className="huge-number">{averageScore}%</span>
                                {trend === 'up' && <span className="trend positive"><TrendingUp size={18} /> Improving</span>}
                                {trend === 'down' && <span className="trend negative"><TrendingDown size={18} /> Needs Focus</span>}
                                {trend === 'flat' && <span className="trend neutral"><GripHorizontal size={18} /> Stable</span>}
                            </div>
                        </div>

                        <form onSubmit={handleAddLog} className="add-log-form premium-panel">
                            <h3>Log New Score</h3>
                            <div className="form-group">
                                <label>Test/Quiz Name</label>
                                <input required type="text" placeholder="e.g. CA1 Maths Paper 2" value={testLabel} onChange={e => setTestLabel(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Score (%)</label>
                                <input required type="number" min="0" max="100" value={testScore} onChange={e => setTestScore(e.target.value)} />
                            </div>
                            <button type="submit" className="btn-primary w-full mt-2">Add Score</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
