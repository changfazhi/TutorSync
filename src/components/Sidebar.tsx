import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, CalendarDays, LineChart, Wallet, Menu } from 'lucide-react';
import './Sidebar.css';

export function Sidebar({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const navItems = [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/students', icon: Users, label: 'Students' },
        { to: '/schedule', icon: CalendarDays, label: 'Schedule' },
        { to: '/analytics', icon: LineChart, label: 'Analytics' },
        { to: '/billing', icon: Wallet, label: 'Billing' },
    ];

    return (
        <div className="layout-container">
            <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-header">
                    {!isCollapsed && <h1 className="logo">TutorSync</h1>}
                    <button
                        className="collapse-btn"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        title="Toggle Sidebar"
                    >
                        <Menu size={20} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        >
                            <item.icon size={22} className="nav-icon" />
                            {!isCollapsed && <span className="nav-label">{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>
            </aside>

            <main className="main-content">
                {children}
            </main>
        </div>
    );
}
