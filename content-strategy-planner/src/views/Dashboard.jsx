import { useMemo } from 'react';
import { PLATFORMS, NICHES } from '../data/strategies.js';
import { getUpcomingPosts } from '../utils/scheduleGenerator.js';

const STATUS_LABELS = {
  planned: { label: 'Planned', color: '#6750A4' },
  shot_ready: { label: 'Shot Ready', color: '#0288D1' },
  recorded: { label: 'Recorded', color: '#FFA000' },
  edited: { label: 'Edited', color: '#388E3C' },
  posted: { label: 'Posted', color: '#546E7A' },
};

function StatCard({ icon, value, label, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: color + '22', color }}>{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function UpcomingPost({ post, onClick }) {
  const pd = PLATFORMS[post.platform];
  const status = STATUS_LABELS[post.status];
  const shotsDone = post.shotList.filter(s => s.completed).length;
  const shotsTotal = post.shotList.length;

  return (
    <div className="upcoming-post" onClick={() => onClick(post)} style={{ borderLeftColor: pd.color }}>
      <div className="post-meta">
        <span className="post-platform" style={{ color: pd.color }}>{pd.icon} {pd.name}</span>
        <span className="post-type">{post.contentType}</span>
      </div>
      <div className="post-title">{post.title}</div>
      <div className="post-footer">
        <span className="post-datetime">
          {formatDate(post.scheduledDate)} · {post.scheduledTime}
        </span>
        <span className="post-status" style={{ color: status.color }}>● {status.label}</span>
      </div>
      {shotsTotal > 0 && (
        <div className="shot-progress-bar">
          <div
            className="shot-progress-fill"
            style={{ width: `${(shotsDone / shotsTotal) * 100}%`, background: pd.color }}
          />
          <span className="shot-progress-label">{shotsDone}/{shotsTotal} shots</span>
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
  if (diff > 1 && diff < 7) return d.toLocaleDateString('en', { weekday: 'long' });
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

export default function Dashboard({ profile, posts, setPosts, setView, setSelectedPost }) {
  const niche = NICHES[profile.niche];
  const upcoming = useMemo(() => getUpcomingPosts(posts, 7), [posts]);
  const today = new Date().toISOString().split('T')[0];

  const stats = useMemo(() => {
    const total = posts.length;
    const posted = posts.filter(p => p.status === 'posted').length;
    const thisWeek = upcoming.length;
    const shotsDone = posts.reduce((acc, p) => acc + p.shotList.filter(s => s.completed).length, 0);
    const shotsTotal = posts.reduce((acc, p) => acc + p.shotList.length, 0);
    return { total, posted, thisWeek, shotsDone, shotsTotal };
  }, [posts, upcoming]);

  const todayPosts = posts.filter(p => p.scheduledDate === today);

  const handlePostClick = (post) => {
    setSelectedPost(post);
    setView('shotlists');
  };

  const markPosted = (postId) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: 'posted' } : p));
  };

  return (
    <div className="view dashboard">
      {/* Welcome */}
      <div className="dashboard-welcome">
        <div>
          <h1>Hi, {profile.brandName} {niche?.icon}</h1>
          <p className="welcome-sub">Here's your content overview for this week.</p>
        </div>
        <div className="platform-chips">
          {profile.platforms.map(p => (
            <span key={p} className="platform-chip" style={{ background: PLATFORMS[p].bg, color: PLATFORMS[p].color }}>
              {PLATFORMS[p].icon} {PLATFORMS[p].name}
            </span>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <StatCard icon="📅" value={stats.thisWeek} label="Posts This Week" color="#6750A4" />
        <StatCard icon="✅" value={stats.posted} label="Posts Published" color="#388E3C" />
        <StatCard icon="📋" value={`${stats.shotsDone}/${stats.shotsTotal}`} label="Shots Captured" color="#0288D1" />
        <StatCard icon="📝" value={stats.total} label="Total Scheduled" color="#E64A19" />
      </div>

      {/* Content pillars */}
      <div className="section">
        <h2 className="section-title">Your Content Pillars</h2>
        <div className="pillars-row">
          {niche?.pillars.map((pillar, i) => (
            <div key={i} className="pillar-chip">{pillar}</div>
          ))}
        </div>
      </div>

      {/* Today's posts */}
      {todayPosts.length > 0 && (
        <div className="section">
          <h2 className="section-title">Post Today 🔔</h2>
          <div className="post-list">
            {todayPosts.map(post => (
              <div key={post.id} className="today-post-row">
                <UpcomingPost post={post} onClick={handlePostClick} />
                {post.status !== 'posted' && (
                  <button className="btn-small" onClick={() => markPosted(post.id)}>
                    Mark as Posted ✓
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming posts */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Upcoming This Week</h2>
          <button className="text-btn" onClick={() => setView('calendar')}>View Calendar →</button>
        </div>
        {upcoming.length === 0 ? (
          <div className="empty-state">No posts scheduled for the next 7 days.</div>
        ) : (
          <div className="post-grid">
            {upcoming.slice(0, 6).map(post => (
              <UpcomingPost key={post.id} post={post} onClick={handlePostClick} />
            ))}
          </div>
        )}
      </div>

      {/* Content ideas */}
      <div className="section">
        <h2 className="section-title">Content Ideas for Your Niche</h2>
        <div className="ideas-grid">
          {niche?.contentIdeas.map((idea, i) => (
            <div key={i} className="idea-card">
              <span className="idea-num">{i + 1}</span>
              <span>{idea}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
