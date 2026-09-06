import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import {
  LayoutDashboard, Users, Building2, FileText, CalendarCheck,
  Trophy, BarChart3, Bot, Search, Menu, GraduationCap
} from 'lucide-react';

import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Companies from './pages/Companies';
import Applications from './pages/Applications';
import Interviews from './pages/Interviews';
import Placements from './pages/Placements';
import Reports from './pages/Reports';
import AIAgent from './pages/AIAgent';
import SearchPage from './pages/SearchPage';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/', section: 'Overview' },
  { label: 'Students', icon: Users, path: '/students', section: 'Management' },
  { label: 'Companies', icon: Building2, path: '/companies', section: 'Management' },
  { label: 'Applications', icon: FileText, path: '/applications', section: 'Tracking' },
  { label: 'Interviews', icon: CalendarCheck, path: '/interviews', section: 'Tracking' },
  { label: 'Placements', icon: Trophy, path: '/placements', section: 'Tracking' },
  { label: 'Reports', icon: BarChart3, path: '/reports', section: 'Analytics' },
  { label: 'AI Agent', icon: Bot, path: '/ai-agent', section: 'Tools' },
  { label: 'Search', icon: Search, path: '/search', section: 'Tools' },
];

function Sidebar({ open, onClose }) {
  const location = useLocation();
  const sections = [...new Set(navItems.map(i => i.section))];

  return (
    <>
      {open && <div className="modal-overlay" style={{ zIndex: 99, background: 'rgba(0,0,0,0.3)' }} onClick={onClose} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: '#6366f1', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={20} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 17 }}>PlaceTrack</h1>
              <p>Placement Management</p>
            </div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {sections.map(section => (
            <div key={section} className="nav-section">
              <div className="nav-section-title">{section}</div>
              {navItems.filter(i => i.section === section).map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <item.icon size={18} />
                  {item.label}
                  {item.path === '/ai-agent' && (
                    <span className="nav-badge">AI</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
            PlaceTrack v1.0 © 2024
          </div>
        </div>
      </aside>
    </>
  );
}

function Header({ onMenuClick }) {
  const location = useLocation();
  const current = navItems.find(i => i.path === location.pathname) || navItems[0];

  return (
    <header className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn btn-ghost" onClick={onMenuClick} style={{ display: 'none', padding: 8 }} id="menu-btn">
          <Menu size={20} />
        </button>
        <div>
          <div className="header-title">{current.label}</div>
        </div>
      </div>
      <div className="header-actions">
        <NavLink to="/search" className="btn btn-secondary btn-sm">
          <Search size={15} />
          Search
        </NavLink>
        <NavLink to="/ai-agent" className="btn btn-primary btn-sm">
          <Bot size={15} />
          AI Agent
        </NavLink>
      </div>
    </header>
  );
}

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="page-container">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/applications" element={<Applications />} />
            <Route path="/interviews" element={<Interviews />} />
            <Route path="/placements" element={<Placements />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/ai-agent" element={<AIAgent />} />
            <Route path="/search" element={<SearchPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { fontSize: 13.5, borderRadius: 10, padding: '10px 14px' } }} />
      <AppLayout />
    </BrowserRouter>
  );
}
