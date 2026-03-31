import { useMemo } from 'react';
import { BATCH_RECORDING_TIPS, PLATFORMS } from '../data/strategies.js';
import { getBatchGroups, BATCH_GROUP_LABELS } from '../utils/scheduleGenerator.js';

function BatchGroupCard({ groupKey, posts }) {
  const meta = BATCH_GROUP_LABELS[groupKey] || BATCH_GROUP_LABELS.general;
  const platforms = [...new Set(posts.map(p => p.platform))];
  const upcoming = posts
    .filter(p => p.status === 'planned' || p.status === 'shot_ready')
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

  if (upcoming.length === 0) return null;

  const nearestDate = upcoming[0]?.scheduledDate;
  const totalShots = upcoming.reduce((acc, p) => acc + p.shotList.filter(s => !s.completed).length, 0);

  return (
    <div className="batch-group-card" style={{ borderLeftColor: meta.color }}>
      <div className="batch-group-header">
        <div className="batch-group-icon" style={{ background: meta.color + '22', color: meta.color }}>
          {meta.icon}
        </div>
        <div className="batch-group-info">
          <h3>{meta.label}</h3>
          <div className="batch-group-meta">
            {upcoming.length} piece{upcoming.length !== 1 ? 's' : ''} · {totalShots} shot{totalShots !== 1 ? 's' : ''} to capture
          </div>
        </div>
        <div className="batch-group-due">
          <span>Next due</span>
          <strong>{formatDate(nearestDate)}</strong>
        </div>
      </div>

      <div className="batch-group-platforms">
        {platforms.map(p => (
          <span key={p} className="platform-mini-chip" style={{ background: PLATFORMS[p].bg, color: PLATFORMS[p].color }}>
            {PLATFORMS[p].icon} {PLATFORMS[p].name}
          </span>
        ))}
      </div>

      <div className="batch-group-posts">
        {upcoming.map(post => {
          const pd = PLATFORMS[post.platform];
          const shotsPending = post.shotList.filter(s => !s.completed).length;
          return (
            <div key={post.id} className="batch-post-row">
              <span className="batch-post-dot" style={{ background: pd.color }} />
              <span className="batch-post-title">{post.title}</span>
              <span className="batch-post-type">{post.contentType}</span>
              <span className="batch-post-shots">{shotsPending} shots</span>
              <span className="batch-post-date">{formatDate(post.scheduledDate)}</span>
            </div>
          );
        })}
      </div>

      <div className="batch-session-tip">
        <span>💡</span>
        <span>Film all {upcoming.length} of these in a single session to save setup time.</span>
      </div>
    </div>
  );
}

function TipCategoryCard({ category }) {
  return (
    <div className="tip-category-card">
      <div className="tip-category-header">
        <span className="tip-category-icon">{category.icon}</span>
        <h3>{category.category}</h3>
      </div>
      <ul className="tip-list">
        {category.tips.map((tip, i) => (
          <li key={i} className="tip-item">
            <span className="tip-bullet">→</span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d - today) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff < 0) return `${Math.abs(diff)}d ago`;
  if (diff < 7) return d.toLocaleDateString('en', { weekday: 'short' });
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

export default function BatchTips({ posts }) {
  const batchGroups = useMemo(() => getBatchGroups(posts), [posts]);
  const hasGroups = Object.values(batchGroups).some(g => g.length > 0);

  const totalPending = useMemo(() =>
    posts.filter(p => p.status === 'planned' || p.status === 'shot_ready').length,
    [posts]
  );

  const estimatedSessions = useMemo(() => {
    const groups = Object.values(batchGroups).filter(g => g.length > 0);
    return groups.length;
  }, [batchGroups]);

  const timeSaved = estimatedSessions > 0 ? Math.round(totalPending * 0.4 * estimatedSessions) : 0;

  return (
    <div className="view batch-tips-view">
      <div className="view-header">
        <h1>Batch Recording Planner</h1>
        <p className="view-subtitle">Maximise your time by grouping similar content into recording sessions.</p>
      </div>

      {/* Time savings banner */}
      {hasGroups && (
        <div className="savings-banner">
          <div className="savings-stat">
            <div className="savings-value">{estimatedSessions}</div>
            <div className="savings-label">Recording Sessions</div>
          </div>
          <div className="savings-divider" />
          <div className="savings-stat">
            <div className="savings-value">{totalPending}</div>
            <div className="savings-label">Pieces to Produce</div>
          </div>
          <div className="savings-divider" />
          <div className="savings-stat">
            <div className="savings-value">~{timeSaved}min</div>
            <div className="savings-label">Est. Time Saved</div>
          </div>
          <div className="savings-message">
            <span>By batching content instead of filming one piece at a time, you save approximately 40% of your total setup and teardown time.</span>
          </div>
        </div>
      )}

      {/* Batch groups */}
      <div className="section">
        <h2 className="section-title">Your Recording Sessions</h2>
        {!hasGroups ? (
          <div className="empty-state">All content is recorded or posted. Great work!</div>
        ) : (
          <div className="batch-groups">
            {Object.entries(batchGroups).map(([key, groupPosts]) => (
              <BatchGroupCard key={key} groupKey={key} posts={groupPosts} />
            ))}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="section">
        <h2 className="section-title">Recording Efficiency Tips</h2>
        <div className="tips-grid">
          {BATCH_RECORDING_TIPS.map((cat, i) => (
            <TipCategoryCard key={i} category={cat} />
          ))}
        </div>
      </div>

      {/* Repurposing guide */}
      <div className="section">
        <h2 className="section-title">Content Repurposing Formula</h2>
        <div className="repurpose-flow">
          <div className="repurpose-step step-main">
            <div className="repurpose-icon">🎬</div>
            <div className="repurpose-label">1 Long-form Video</div>
            <div className="repurpose-sub">e.g. 10-min YouTube</div>
          </div>
          <div className="repurpose-arrow">→</div>
          <div className="repurpose-outcomes">
            <div className="repurpose-outcome">📱 3–5 Reels / TikToks</div>
            <div className="repurpose-outcome">📊 1 Carousel Post</div>
            <div className="repurpose-outcome">🧵 5–8 Tweet/Thread Points</div>
            <div className="repurpose-outcome">💼 1 LinkedIn Post</div>
            <div className="repurpose-outcome">📌 3–5 Pinterest Pins</div>
            <div className="repurpose-outcome">📖 1 Blog Post / Article</div>
          </div>
        </div>
        <div className="repurpose-caption">
          One recording session can generate <strong>16–25 pieces of content</strong> across all your platforms.
        </div>
      </div>
    </div>
  );
}
