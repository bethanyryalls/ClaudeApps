import { useState, useMemo } from 'react';
import { PLATFORMS } from '../data/strategies.js';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarView({ posts, setPosts, setSelectedPost, setView }) {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selectedDate, setSelectedDate] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterPlatform, setFilterPlatform] = useState('all');

  const { year, month } = currentDate;
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const postsByDate = useMemo(() => {
    const map = {};
    posts.forEach(p => {
      if (!map[p.scheduledDate]) map[p.scheduledDate] = [];
      map[p.scheduledDate].push(p);
    });
    return map;
  }, [posts]);

  const filteredPostsByDate = useMemo(() => {
    if (filterPlatform === 'all') return postsByDate;
    const map = {};
    Object.entries(postsByDate).forEach(([date, ps]) => {
      const filtered = ps.filter(p => p.platform === filterPlatform);
      if (filtered.length > 0) map[date] = filtered;
    });
    return map;
  }, [postsByDate, filterPlatform]);

  const prevMonth = () => {
    setCurrentDate(d => {
      if (d.month === 0) return { year: d.year - 1, month: 11 };
      return { ...d, month: d.month - 1 };
    });
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(d => {
      if (d.month === 11) return { year: d.year + 1, month: 0 };
      return { ...d, month: d.month + 1 };
    });
    setSelectedDate(null);
  };

  const dateStr = (day) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const todayStr = today.toISOString().split('T')[0];

  const selectedDatePosts = selectedDate ? (filteredPostsByDate[selectedDate] || []) : [];

  const updatePostStatus = (postId, status) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, status } : p));
  };

  const openPost = (post) => {
    setSelectedPost(post);
    setView('shotlists');
  };

  // Collect all platforms used
  const usedPlatforms = useMemo(() => {
    const set = new Set(posts.map(p => p.platform));
    return Array.from(set);
  }, [posts]);

  return (
    <div className="view calendar-view">
      <div className="calendar-header">
        <div className="calendar-title-row">
          <h1>Content Calendar</h1>
          <div className="platform-filter">
            <button
              className={`filter-chip ${filterPlatform === 'all' ? 'active' : ''}`}
              onClick={() => setFilterPlatform('all')}
            >All</button>
            {usedPlatforms.map(p => (
              <button
                key={p}
                className={`filter-chip ${filterPlatform === p ? 'active' : ''}`}
                onClick={() => setFilterPlatform(p)}
                style={filterPlatform === p ? { background: PLATFORMS[p].color, color: '#fff', borderColor: PLATFORMS[p].color } : {}}
              >
                {PLATFORMS[p].icon} {PLATFORMS[p].name}
              </button>
            ))}
          </div>
        </div>
        <div className="calendar-nav">
          <button className="nav-btn" onClick={prevMonth}>‹</button>
          <h2>{MONTHS[month]} {year}</h2>
          <button className="nav-btn" onClick={nextMonth}>›</button>
        </div>
      </div>

      <div className="calendar-grid">
        {/* Day headers */}
        {DAYS.map(d => (
          <div key={d} className="cal-day-header">{d}</div>
        ))}

        {/* Empty cells before month start */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="cal-cell empty" />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const ds = dateStr(day);
          const dayPosts = filteredPostsByDate[ds] || [];
          const isToday = ds === todayStr;
          const isSelected = ds === selectedDate;
          const isPast = ds < todayStr;

          return (
            <div
              key={day}
              className={`cal-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${isPast ? 'past' : ''}`}
              onClick={() => setSelectedDate(ds === selectedDate ? null : ds)}
            >
              <div className="cal-day-num">{day}</div>
              <div className="cal-posts">
                {dayPosts.slice(0, 3).map(p => (
                  <div
                    key={p.id}
                    className="cal-post-dot"
                    style={{ background: PLATFORMS[p.platform].color }}
                    title={`${PLATFORMS[p.platform].name}: ${p.title}`}
                  >
                    <span className="cal-post-label">{p.contentType.split(' ')[0]}</span>
                  </div>
                ))}
                {dayPosts.length > 3 && (
                  <div className="cal-post-more">+{dayPosts.length - 3}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected day panel */}
      {selectedDate && (
        <div className="day-panel">
          <div className="day-panel-header">
            <h3>{formatFullDate(selectedDate)}</h3>
            <button className="close-btn" onClick={() => setSelectedDate(null)}>✕</button>
          </div>
          {selectedDatePosts.length === 0 ? (
            <div className="empty-state">No posts scheduled for this day.</div>
          ) : (
            <div className="day-post-list">
              {selectedDatePosts.map(post => {
                const pd = PLATFORMS[post.platform];
                const done = post.shotList.filter(s => s.completed).length;
                const total = post.shotList.length;
                return (
                  <div key={post.id} className="day-post-card" style={{ borderLeftColor: pd.color }}>
                    <div className="day-post-meta">
                      <span style={{ color: pd.color }}>{pd.icon} {pd.name}</span>
                      <span className="post-type-badge">{post.contentType}</span>
                      <span className="post-time">⏰ {post.scheduledTime}</span>
                    </div>
                    <div className="day-post-title">{post.title}</div>
                    {total > 0 && (
                      <div className="shot-mini-progress">
                        <div className="shot-progress-bar">
                          <div className="shot-progress-fill" style={{ width: `${(done / total) * 100}%`, background: pd.color }} />
                        </div>
                        <span>{done}/{total} shots done</span>
                      </div>
                    )}
                    <div className="day-post-actions">
                      <button className="btn-small" onClick={() => openPost(post)}>View Shot List</button>
                      <select
                        value={post.status}
                        onChange={e => updatePostStatus(post.id, e.target.value)}
                        className="status-select"
                      >
                        <option value="planned">Planned</option>
                        <option value="shot_ready">Shot Ready</option>
                        <option value="recorded">Recorded</option>
                        <option value="edited">Edited</option>
                        <option value="posted">Posted ✓</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="calendar-legend">
        {usedPlatforms.map(p => (
          <div key={p} className="legend-item">
            <span className="legend-dot" style={{ background: PLATFORMS[p].color }} />
            <span>{PLATFORMS[p].name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatFullDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' });
}
