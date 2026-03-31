const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
  { id: 'calendar', label: 'Calendar', icon: '📅' },
  { id: 'shotlists', label: 'Shot Lists', icon: '🎬' },
  { id: 'batch', label: 'Batch Plan', icon: '⚡' },
];

export default function Navigation({ view, setView, brandName, onReset }) {
  return (
    <>
      {/* Desktop sidebar */}
      <nav className="sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-logo">📅</span>
          <div className="sidebar-brand-info">
            <span className="sidebar-app-name">Content Planner</span>
            <span className="sidebar-user">{brandName}</span>
          </div>
        </div>
        <div className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`nav-item ${view === item.id ? 'active' : ''}`}
              onClick={() => setView(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </div>
        <div className="sidebar-footer">
          <button className="nav-item reset-btn" onClick={onReset}>
            <span className="nav-icon">⚙️</span>
            <span className="nav-label">Reset Strategy</span>
          </button>
        </div>
      </nav>

      {/* Mobile bottom bar */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`bottom-nav-item ${view === item.id ? 'active' : ''}`}
            onClick={() => setView(item.id)}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
