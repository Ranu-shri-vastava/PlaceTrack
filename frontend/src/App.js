import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Users, Building2, FileText, CalendarCheck,
  Trophy, BarChart3, Bot, Search, Menu, GraduationCap,
  Download, RefreshCw, WifiOff
} from 'lucide-react';

import Dashboard    from './pages/Dashboard';
import Students     from './pages/Students';
import Companies    from './pages/Companies';
import Applications from './pages/Applications';
import Interviews   from './pages/Interviews';
import Placements   from './pages/Placements';
import Reports      from './pages/Reports';
import AIAgent      from './pages/AIAgent';
import SearchPage   from './pages/SearchPage';

const navItems = [
  { label: 'Dashboard',    icon: LayoutDashboard, path: '/',            section: 'Overview'    },
  { label: 'Students',     icon: Users,           path: '/students',    section: 'Management'  },
  { label: 'Companies',    icon: Building2,       path: '/companies',   section: 'Management'  },
  { label: 'Applications', icon: FileText,        path: '/applications',section: 'Tracking'    },
  { label: 'Interviews',   icon: CalendarCheck,   path: '/interviews',  section: 'Tracking'    },
  { label: 'Placements',   icon: Trophy,          path: '/placements',  section: 'Tracking'    },
  { label: 'Reports',      icon: BarChart3,       path: '/reports',     section: 'Analytics'   },
  { label: 'AI Agent',     icon: Bot,             path: '/ai-agent',    section: 'Tools'       },
  { label: 'Search',       icon: Search,          path: '/search',      section: 'Tools'       },
];

/* ── PWA Install Banner ─────────────────────────── */
function InstallBanner({ onInstall, onDismiss }) {
  return (
    <div style={{
      position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
      background: '#1e1b4b', color: 'white', borderRadius: 14,
      padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14,
      boxShadow: '0 8px 32px rgba(0,0,0,0.35)', zIndex: 9999,
      maxWidth: 420, width: 'calc(100% - 32px)', animation: 'slideUp .3s ease',
    }}>
      <div style={{ background: '#6366f1', borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <GraduationCap size={20} color="white" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>Install PlaceTrack</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>
          Home screen par add karo — app jaisi feel milegi
        </div>
      </div>
      <button onClick={onInstall} style={{
        background: '#6366f1', color: 'white', border: 'none', borderRadius: 8,
        padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, fontFamily: 'inherit',
      }}>
        <Download size={14} /> Install
      </button>
      <button onClick={onDismiss} style={{
        background: 'transparent', color: 'rgba(255,255,255,0.5)', border: 'none',
        cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px', flexShrink: 0,
      }}>×</button>
    </div>
  );
}

/* ── Offline Banner ─────────────────────────────── */
function OfflineBanner() {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9998,
      background: '#ef4444', color: 'white',
      padding: '10px 16px', textAlign: 'center',
      fontSize: 13, fontWeight: 500,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    }}>
      <WifiOff size={15} />
      You are offline. Some features may not work.
    </div>
  );
}

/* ── Update Banner ──────────────────────────────── */
function UpdateBanner({ onUpdate }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9998,
      background: '#6366f1', color: 'white',
      padding: '10px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
      fontSize: 13,
    }}>
      <RefreshCw size={14} />
      <span>New version available!</span>
      <button onClick={onUpdate} style={{
        background: 'white', color: '#6366f1', border: 'none', borderRadius: 6,
        padding: '4px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
      }}>
        Update Now
      </button>
    </div>
  );
}

/* ── Sidebar ────────────────────────────────────── */
function Sidebar({ open, onClose, onInstall, installable }) {
  const sections = [...new Set(navItems.map(i => i.section))];

  return (
    <>
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 99 }}
          onClick={onClose}
        />
      )}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              background: '#6366f1', borderRadius: 10,
              width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <GraduationCap size={20} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 17 }}>PlaceTrack</h1>
              <p>Placement Management</p>
            </div>
          </div>
        </div>

        {/* Nav */}
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
                  {item.path === '/ai-agent' && <span className="nav-badge">AI</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Bottom: Install button + version */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          {installable && (
            <button
              onClick={onInstall}
              style={{
                width: '100%', background: '#6366f1', color: 'white',
                border: 'none', borderRadius: 10, padding: '10px 14px',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, marginBottom: 10, fontFamily: 'inherit',
                transition: 'background .15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#4f46e5'}
              onMouseLeave={e => e.currentTarget.style.background = '#6366f1'}
            >
              <Download size={15} /> Install App
            </button>
          )}
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
            PlaceTrack v1.0 · PWA
          </div>
        </div>
      </aside>
    </>
  );
}

/* ── Header ─────────────────────────────────────── */
function Header({ onMenuClick }) {
  const location = useLocation();
  const current  = navItems.find(i => i.path === location.pathname) || navItems[0];

  return (
    <header className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Hamburger — shown via CSS on mobile */}
        <button
          className="btn btn-ghost"
          onClick={onMenuClick}
          style={{ padding: 8 }}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div className="header-title">{current.label}</div>
      </div>
      <div className="header-actions">
        <NavLink to="/search" className="btn btn-secondary btn-sm">
          <Search size={15} /> Search
        </NavLink>
        <NavLink to="/ai-agent" className="btn btn-primary btn-sm">
          <Bot size={15} /> AI Agent
        </NavLink>
      </div>
    </header>
  );
}

/* ── App Layout ─────────────────────────────────── */
function AppLayout() {
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [installable,  setInstallable]  = useState(false);
  const [showBanner,   setShowBanner]   = useState(false);
  const [isOffline,    setIsOffline]    = useState(!navigator.onLine);
  const [updateReady,  setUpdateReady]  = useState(false);

  /* PWA events */
  useEffect(() => {
    // Install prompt
    const onInstallable = () => { setInstallable(true); setShowBanner(true); };
    window.addEventListener('pwa-installable', onInstallable);

    // SW update available
    const onUpdate = () => setUpdateReady(true);
    window.addEventListener('pwa-update-available', onUpdate);

    // Online / offline
    const goOnline  = () => { setIsOffline(false); toast.success('Back online!'); };
    const goOffline = () => { setIsOffline(true);  toast.error('You are offline'); };
    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('pwa-installable',        onInstallable);
      window.removeEventListener('pwa-update-available',   onUpdate);
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const handleInstall = async () => {
    const prompt = window.deferredInstallPrompt;
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      toast.success('PlaceTrack installed! 🎉');
      setInstallable(false);
    }
    setShowBanner(false);
    window.deferredInstallPrompt = null;
  };

  const handleUpdate = () => {
    window.location.reload();
  };

  return (
    <div className="app-layout">
      {/* Banners */}
      {isOffline   && <OfflineBanner />}
      {updateReady && <UpdateBanner onUpdate={handleUpdate} />}
      {showBanner  && installable && (
        <InstallBanner
          onInstall={handleInstall}
          onDismiss={() => setShowBanner(false)}
        />
      )}

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onInstall={handleInstall}
        installable={installable}
      />

      <div className="main-content" style={{ paddingTop: (isOffline || updateReady) ? 44 : 0 }}>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="page-container">
          <Routes>
            <Route path="/"            element={<Dashboard />}    />
            <Route path="/students"    element={<Students />}     />
            <Route path="/companies"   element={<Companies />}    />
            <Route path="/applications"element={<Applications />} />
            <Route path="/interviews"  element={<Interviews />}   />
            <Route path="/placements"  element={<Placements />}   />
            <Route path="/reports"     element={<Reports />}      />
            <Route path="/ai-agent"    element={<AIAgent />}      />
            <Route path="/search"      element={<SearchPage />}   />
          </Routes>
        </main>
      </div>
    </div>
  );
}

/* ── Root ───────────────────────────────────────── */
export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { fontSize: 13.5, borderRadius: 10, padding: '10px 14px' },
        }}
      />
      <AppLayout />
    </BrowserRouter>
  );
}

/* Slide-up animation for install banner */
const styleEl = document.createElement('style');
styleEl.textContent = `@keyframes slideUp { from { transform: translateX(-50%) translateY(80px); opacity:0; } to { transform: translateX(-50%) translateY(0); opacity:1; } }`;
document.head.appendChild(styleEl);
