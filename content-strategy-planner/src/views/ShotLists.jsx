import { useState, useMemo, useEffect } from 'react';
import { PLATFORMS } from '../data/strategies.js';
import { requestNotificationPermission, scheduleRecordingReminder } from '../utils/notifications.js';

const STATUS_COLORS = {
  planned: '#6750A4',
  shot_ready: '#0288D1',
  recorded: '#FFA000',
  edited: '#388E3C',
  posted: '#546E7A',
};

function ShotItem({ shot, onToggle }) {
  return (
    <div className={`shot-item ${shot.completed ? 'done' : ''}`} onClick={() => onToggle(shot.id)}>
      <div className={`shot-checkbox ${shot.completed ? 'checked' : ''}`}>
        {shot.completed && <span>✓</span>}
      </div>
      <div className="shot-content">
        <div className="shot-description">{shot.description}</div>
        {shot.tip && <div className="shot-tip">💡 {shot.tip}</div>}
      </div>
    </div>
  );
}

function PostShotCard({ post, onToggleShot, onStatusChange, onSetReminder, isExpanded, onToggleExpand }) {
  const pd = PLATFORMS[post.platform];
  const done = post.shotList.filter(s => s.completed).length;
  const total = post.shotList.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className={`shot-card ${isExpanded ? 'expanded' : ''}`}>
      <div className="shot-card-header" onClick={onToggleExpand}>
        <div className="shot-card-left">
          <div className="shot-platform-badge" style={{ background: pd.bg, color: pd.color }}>
            {pd.icon} {pd.name}
          </div>
          <div className="shot-card-info">
            <div className="shot-card-title">{post.title}</div>
            <div className="shot-card-meta">
              {post.contentType} · {formatDate(post.scheduledDate)} at {post.scheduledTime}
            </div>
          </div>
        </div>
        <div className="shot-card-right">
          <div className="shot-pct" style={{ color: pct === 100 ? '#388E3C' : pd.color }}>
            {pct === 100 ? '✓ Complete' : `${pct}%`}
          </div>
          <div className="shot-progress-bar" style={{ width: 80 }}>
            <div className="shot-progress-fill" style={{ width: `${pct}%`, background: pct === 100 ? '#388E3C' : pd.color }} />
          </div>
          <span className="shot-count">{done}/{total}</span>
          <span className={`expand-arrow ${isExpanded ? 'up' : ''}`}>›</span>
        </div>
      </div>

      {isExpanded && (
        <div className="shot-card-body">
          {/* Status row */}
          <div className="shot-card-actions">
            <div className="status-row">
              <span>Status:</span>
              <select
                value={post.status}
                onChange={e => onStatusChange(post.id, e.target.value)}
                className="status-select"
                style={{ borderColor: STATUS_COLORS[post.status] }}
              >
                <option value="planned">📋 Planned</option>
                <option value="shot_ready">🎯 Shot Ready</option>
                <option value="recorded">🎬 Recorded</option>
                <option value="edited">✂️ Edited</option>
                <option value="posted">✅ Posted</option>
              </select>
            </div>
            {post.status === 'planned' && (
              <button
                className={`btn-remind ${post.reminderSet ? 'active' : ''}`}
                onClick={() => onSetReminder(post.id)}
              >
                {post.reminderSet ? '🔔 Reminder Set' : '🔔 Set Recording Reminder'}
              </button>
            )}
          </div>

          {/* Shot list */}
          <div className="shot-list">
            <div className="shot-list-header">
              <h4>Shot List</h4>
              <span className="shot-all-done" onClick={() => {
                const allDone = done === total;
                post.shotList.forEach(s => { if (s.completed === allDone) onToggleShot(post.id, s.id); });
              }}>
                {done === total ? 'Uncheck All' : 'Check All'}
              </span>
            </div>
            {post.shotList.map(shot => (
              <ShotItem
                key={shot.id}
                shot={shot}
                onToggle={(shotId) => onToggleShot(post.id, shotId)}
              />
            ))}
          </div>

          {/* Notes */}
          <div className="shot-notes">
            <label>Notes / Ideas</label>
            <div className="shot-notes-content">{post.notes || <span className="placeholder">No notes yet — tap to add</span>}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d - today) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff < 0) return `${Math.abs(diff)} days ago`;
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

export default function ShotLists({ posts, setPosts, selectedPost, setSelectedPost }) {
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedId, setExpandedId] = useState(selectedPost?.id || null);
  const [notifGranted, setNotifGranted] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (selectedPost) {
      setExpandedId(selectedPost.id);
      setSelectedPost(null);
    }
  }, [selectedPost, setSelectedPost]);

  useEffect(() => {
    if ('Notification' in window) {
      setNotifGranted(Notification.permission === 'granted');
    }
  }, []);

  const usedPlatforms = useMemo(() => [...new Set(posts.map(p => p.platform))], [posts]);

  const filtered = useMemo(() => {
    return posts.filter(p => {
      if (filterPlatform !== 'all' && p.platform !== filterPlatform) return false;
      if (filterStatus !== 'all' && p.status !== filterStatus) return false;
      if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [posts, filterPlatform, filterStatus, search]);

  const upcoming = filtered.filter(p => p.status !== 'posted').sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  const posted = filtered.filter(p => p.status === 'posted').sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate));

  const toggleShot = (postId, shotId) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const newShots = p.shotList.map(s => s.id === shotId ? { ...s, completed: !s.completed } : s);
      const allDone = newShots.every(s => s.completed);
      return { ...p, shotList: newShots, status: allDone && p.status === 'planned' ? 'shot_ready' : p.status };
    }));
  };

  const changeStatus = (postId, status) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, status } : p));
  };

  const setReminder = async (postId) => {
    if (!notifGranted) {
      const granted = await requestNotificationPermission();
      setNotifGranted(granted);
      if (!granted) {
        alert('Please allow notifications in your browser to receive recording reminders.');
        return;
      }
    }
    const post = posts.find(p => p.id === postId);
    if (post) {
      scheduleRecordingReminder(post, 1);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, reminderSet: true } : p));
    }
  };

  const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id);

  const totalShots = posts.reduce((acc, p) => acc + p.shotList.length, 0);
  const completedShots = posts.reduce((acc, p) => acc + p.shotList.filter(s => s.completed).length, 0);

  return (
    <div className="view shot-lists-view">
      <div className="view-header">
        <h1>Shot Lists</h1>
        <div className="overall-progress">
          <span>{completedShots} / {totalShots} total shots captured</span>
          <div className="overall-bar">
            <div className="overall-fill" style={{ width: `${totalShots ? (completedShots / totalShots) * 100 : 0}%` }} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-row">
        <input
          type="text"
          className="search-input"
          placeholder="Search posts..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="filter-chips">
          <button className={`filter-chip ${filterPlatform === 'all' ? 'active' : ''}`} onClick={() => setFilterPlatform('all')}>All Platforms</button>
          {usedPlatforms.map(p => (
            <button
              key={p}
              className={`filter-chip ${filterPlatform === p ? 'active' : ''}`}
              onClick={() => setFilterPlatform(p)}
              style={filterPlatform === p ? { background: PLATFORMS[p].color, color: '#fff', borderColor: PLATFORMS[p].color } : {}}
            >{PLATFORMS[p].icon} {PLATFORMS[p].name}</button>
          ))}
        </div>
        <div className="filter-chips">
          {[['all', 'All Status'], ['planned', 'Planned'], ['shot_ready', 'Shot Ready'], ['recorded', 'Recorded'], ['edited', 'Edited']].map(([val, lbl]) => (
            <button
              key={val}
              className={`filter-chip ${filterStatus === val ? 'active' : ''}`}
              onClick={() => setFilterStatus(val)}
            >{lbl}</button>
          ))}
        </div>
      </div>

      {/* Notification prompt */}
      {!notifGranted && 'Notification' in window && (
        <div className="notif-banner">
          <span>🔔 Enable notifications to get reminded when it's time to record</span>
          <button className="btn-small" onClick={async () => {
            const g = await requestNotificationPermission();
            setNotifGranted(g);
          }}>Enable</button>
        </div>
      )}

      {/* Upcoming posts */}
      <div className="section">
        <h2 className="section-title">Upcoming ({upcoming.length})</h2>
        {upcoming.length === 0 ? (
          <div className="empty-state">No upcoming posts match your filters.</div>
        ) : (
          <div className="shot-cards">
            {upcoming.map(post => (
              <PostShotCard
                key={post.id}
                post={post}
                onToggleShot={toggleShot}
                onStatusChange={changeStatus}
                onSetReminder={setReminder}
                isExpanded={expandedId === post.id}
                onToggleExpand={() => toggleExpand(post.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Posted */}
      {posted.length > 0 && (
        <div className="section">
          <h2 className="section-title">Published ({posted.length})</h2>
          <div className="shot-cards">
            {posted.map(post => (
              <PostShotCard
                key={post.id}
                post={post}
                onToggleShot={toggleShot}
                onStatusChange={changeStatus}
                onSetReminder={setReminder}
                isExpanded={expandedId === post.id}
                onToggleExpand={() => toggleExpand(post.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
