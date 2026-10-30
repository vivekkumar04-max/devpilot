import { useEffect, useState } from 'react';
import { Bell, CircleHelp, LogOut, Menu, Settings2, UserRound, FolderGit2, LayoutDashboard } from 'lucide-react';
import Brand from './components/Brand';
import AuthPanel from './components/AuthPanel';
import SetupWorkspace from './components/SetupWorkspace';
import ProfileModal from './components/ProfileModal';
import RecentRepositories from './components/RecentRepositories';
import { apiRequest } from './services/api';

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('devpilot_user') || 'null'); }
    catch { return null; }
  });
  const [recentRepositories, setRecentRepositories] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [activeView, setActiveView] = useState('setup');
  const [pendingRepoUrl, setPendingRepoUrl] = useState('');

  useEffect(() => {
    if (!user || !localStorage.getItem('devpilot_token')) return;
    apiRequest('/auth/me')
      .then((data) => {
        setUser(data.user);
        localStorage.setItem('devpilot_user', JSON.stringify(data.user));
        setRecentRepositories(data.recentRepositories || []);
      })
      .catch(() => {
        // Keep the local display state; protected API calls will show session errors.
      });
  }, []);

  function onAuth(next) {
    localStorage.setItem('devpilot_user', JSON.stringify(next));
    setUser(next);
    setActiveView('setup');
    apiRequest('/auth/me').then((data) => {
      setRecentRepositories(data.recentRepositories || []);
      setUser(data.user);
      localStorage.setItem('devpilot_user', JSON.stringify(data.user));
    }).catch(() => {});
  }

  function applyUpdatedUser(next) {
    setUser(next);
    localStorage.setItem('devpilot_user', JSON.stringify(next));
  }

  function logout() {
    localStorage.removeItem('devpilot_token');
    localStorage.removeItem('devpilot_user');
    setUser(null);
    setRecentRepositories([]);
    setShowProfile(false);
    setActiveView('setup');
  }

  async function refreshHistory() {
    try {
      const data = await apiRequest('/auth/me');
      setRecentRepositories(data.recentRepositories || []);
      if (data.user) applyUpdatedUser(data.user);
    } catch {}
  }

  function analyzeRecent(url) {
    setPendingRepoUrl(url);
    setActiveView('setup');
  }

  if (!user) return <AuthPanel onAuth={onAuth}/>;

  const avatar = user.avatarDataUrl
    ? <img src={user.avatarDataUrl} alt="" className="avatar-image" />
    : <span>{user.name?.[0]?.toUpperCase() || 'D'}</span>;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${showMenu ? 'sidebar-open' : ''}`}>
        <Brand/>
        <button className="workspace-switch workspace-switch-button" onClick={() => setShowProfile(true)}>
          <div className="avatar">{avatar}</div>
          <div><strong>{user.name}</strong><small>Personal workspace</small></div>
          <Settings2 size={16}/>
        </button>
        <div className="nav-label">WORKSPACE</div>
        <button className={`nav-item ${activeView === 'setup' ? 'active' : ''}`} onClick={() => { setActiveView('setup'); setShowMenu(false); }}>
          <LayoutDashboard size={15}/><span>Setup planner</span>
        </button>
        <button className={`nav-item ${activeView === 'recent' ? 'active' : ''}`} onClick={() => { setActiveView('recent'); setShowMenu(false); refreshHistory(); }}>
          <FolderGit2 size={15}/><span>Recent repositories</span><span className="nav-count">{recentRepositories.length}</span>
        </button>
        <div className="sidebar-bottom">
          <div className="help-card"><CircleHelp size={18}/><strong>Getting started</strong><p>Paste a public GitHub URL to create a setup plan. Your analyzed repositories are saved here.</p></div>
          <button className="logout-button" onClick={logout}><LogOut size={16}/> Sign out</button>
          <small className="version">DEVPILOT STARTER · v0.2</small>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setShowMenu(!showMenu)} aria-label="Toggle menu"><Menu size={20}/></button>
          <div className="breadcrumbs">Workspace <span>/</span> <b>{activeView === 'recent' ? 'Recent repositories' : 'Setup planner'}</b></div>
          <div className="top-actions">
            <span className="connection-status"><i/> API workspace</span>
            <button className="icon-button" title="Notifications" aria-label="Notifications"><Bell size={17}/></button>
            <button className="top-avatar top-avatar-button" title="Edit profile" onClick={() => setShowProfile(true)}>
              {user.avatarDataUrl ? <img src={user.avatarDataUrl} alt="" className="avatar-image"/> : (user.name?.[0]?.toUpperCase() || 'D')}
            </button>
          </div>
        </header>

        <div className="page-container">
          {activeView === 'recent'
            ? <RecentRepositories repositories={recentRepositories} onAnalyze={analyzeRecent}/>
            : <SetupWorkspace initialRepoUrl={pendingRepoUrl} onPlanGenerated={() => { setPendingRepoUrl(""); refreshHistory(); }}/>}
          <footer className="footer"><span>DevPilot · Built to make local setup less painful.</span><span>Manual checklist mode <i/></span></footer>
        </div>
      </main>
      {showProfile && <ProfileModal user={user} onClose={() => setShowProfile(false)} onSaved={applyUpdatedUser}/>}
    </div>
  );
}
