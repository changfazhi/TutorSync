import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { useEffect } from 'react';
import db, { resetAndSeedDatabase } from './db';

import { Dashboard } from './pages/Dashboard';
import { Students } from './pages/Students';
import { Schedule } from './pages/Schedule';
import { Analytics } from './pages/Analytics';

const Billing = () => <div><h2>Billing & Payments</h2></div>;

function App() {

  // Seed Database on first load if empty
  useEffect(() => {
    const initDb = async () => {
      const count = await db.students.count();
      if (count === 0) {
        console.log('Seeding initial data...');
        await resetAndSeedDatabase();
      }
    };
    initDb();
  }, []);

  return (
    <Router>
      <Sidebar>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/students/*" element={<Students />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/billing" element={<Billing />} />
        </Routes>
      </Sidebar>
    </Router>
  );
}

export default App;
