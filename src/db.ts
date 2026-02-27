import Dexie, { type EntityTable } from 'dexie';

export interface Student {
    id?: number;
    name: string;
    parentContact: string;
    location: string;
    subject: string;
    level: string;
    examTopics?: string;
    examDate?: Date;
    hourlyRate: number;
    createdAt: Date;
}

export interface Lesson {
    id?: number;
    studentId: number;
    date: Date;
    status: 'past' | 'scheduled';
    paymentStatus: 'unpaid' | 'pending' | 'paid';
    topicsCovered?: string;
    topicsForNext?: string;
    durationHours: number;
    scoreLogs?: { label: string; score: string }[];
    qualitativeFeedback?: string;
}

export interface Todo {
    id?: number;
    title: string;
    studentId?: number; // Optional, ties a todo to a specific student. If null, global.
    isCompleted: boolean;
    dueDate?: Date;
    urgency: 'low' | 'medium' | 'high';
}

const db = new Dexie('TutorSyncDB') as Dexie & {
    students: EntityTable<
        Student,
        'id'
    >;
    lessons: EntityTable<
        Lesson,
        'id'
    >;
    todos: EntityTable<
        Todo,
        'id'
    >;
};

// Schema declaration
db.version(1).stores({
    students: '++id, name, subject, level',
    lessons: '++id, studentId, date, status, paymentStatus',
    todos: '++id, studentId, isCompleted, dueDate, urgency'
});

export async function resetAndSeedDatabase() {
    await db.transaction('rw', db.students, db.lessons, db.todos, async () => {
        await db.students.clear();
        await db.lessons.clear();
        await db.todos.clear();

        const sarahId = await db.students.add({
            name: 'Sarah Tan',
            parentContact: '+65 9123 4567',
            location: 'Block 123, Ang Mo Kio Ave 3',
            subject: 'Mathematics',
            level: 'GCE O-Level',
            examTopics: 'Algebra, Trigonometry',
            examDate: new Date('2026-10-15'),
            hourlyRate: 60,
            createdAt: new Date()
        });

        const johnId = await db.students.add({
            name: 'John Doe',
            parentContact: '+65 8234 5678',
            location: 'Condo 45, Orchard Road',
            subject: 'H2 Mathematics',
            level: 'A-Level',
            examTopics: 'Calculus, Vectors',
            examDate: new Date('2026-11-05'),
            hourlyRate: 80,
            createdAt: new Date()
        });

        // Seed Lessons
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        await db.lessons.add({
            studentId: sarahId as number,
            date: today,
            status: 'scheduled',
            paymentStatus: 'unpaid',
            topicsForNext: 'Revision on Quadratic Equations',
            durationHours: 2
        });

        await db.lessons.add({
            studentId: johnId as number,
            date: tomorrow,
            status: 'scheduled',
            paymentStatus: 'unpaid',
            topicsForNext: 'Integration techniques',
            durationHours: 1.5
        });

        // Seed Todos
        await db.todos.add({
            title: 'Grade mock paper for Sarah',
            studentId: sarahId as number,
            isCompleted: false,
            urgency: 'high'
        });

        await db.todos.add({
            title: 'Print integration worksheets for John',
            studentId: johnId as number,
            isCompleted: false,
            urgency: 'medium'
        });
    });
}

export default db;
