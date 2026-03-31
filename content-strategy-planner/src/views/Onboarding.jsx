import { useState } from 'react';
import { PLATFORMS, NICHES, GOALS } from '../data/strategies.js';

const STEPS = ['Your Brand', 'Platforms', 'Frequency', 'Goals'];

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({
    brandName: '',
    niche: '',
    platforms: [],
    frequency: {},
    goals: [],
  });

  const canNext = () => {
    if (step === 0) return profile.brandName.trim().length > 0 && profile.niche;
    if (step === 1) return profile.platforms.length > 0;
    if (step === 2) return profile.platforms.every(p => (profile.frequency[p] || 0) > 0);
    if (step === 3) return profile.goals.length > 0;
    return false;
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else onComplete(profile);
  };

  const togglePlatform = (p) => {
    setProfile(prev => {
      const has = prev.platforms.includes(p);
      const platforms = has ? prev.platforms.filter(x => x !== p) : [...prev.platforms, p];
      const frequency = { ...prev.frequency };
      if (has) delete frequency[p];
      else frequency[p] = 3;
      return { ...prev, platforms, frequency };
    });
  };

  const toggleGoal = (g) => {
    setProfile(prev => ({
      ...prev,
      goals: prev.goals.includes(g) ? prev.goals.filter(x => x !== g) : [...prev.goals, g],
    }));
  };

  return (
    <div className="onboarding">
      <div className="onboarding-card">
        {/* Header */}
        <div className="onboarding-header">
          <div className="brand-logo">📅</div>
          <h1>Content Strategy Planner</h1>
          <p>Let's build your personalised content strategy in 4 quick steps.</p>
        </div>

        {/* Steps indicator */}
        <div className="steps-indicator">
          {STEPS.map((s, i) => (
            <div key={s} className={`step-dot ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
              <span>{i < step ? '✓' : i + 1}</span>
              <label>{s}</label>
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="step-content">
          {step === 0 && (
            <div className="step-panel">
              <h2>Tell us about your brand</h2>
              <div className="form-group">
                <label>Brand / Creator Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Fitness, TechWithMike"
                  value={profile.brandName}
                  onChange={e => setProfile(p => ({ ...p, brandName: e.target.value }))}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Your Niche</label>
                <div className="niche-grid">
                  {Object.entries(NICHES).map(([key, n]) => (
                    <button
                      key={key}
                      className={`niche-card ${profile.niche === key ? 'selected' : ''}`}
                      onClick={() => setProfile(p => ({ ...p, niche: key }))}
                    >
                      <span className="niche-icon">{n.icon}</span>
                      <span className="niche-name">{n.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="step-panel">
              <h2>Which platforms are you on?</h2>
              <p className="step-hint">Select all that apply. You can always change this later.</p>
              <div className="platform-grid">
                {Object.entries(PLATFORMS).map(([key, p]) => (
                  <button
                    key={key}
                    className={`platform-card ${profile.platforms.includes(key) ? 'selected' : ''}`}
                    onClick={() => togglePlatform(key)}
                    style={{ '--platform-color': p.color }}
                  >
                    <span className="platform-icon">{p.icon}</span>
                    <span className="platform-name">{p.name}</span>
                    {profile.platforms.includes(key) && <span className="check">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="step-panel">
              <h2>How often do you want to post?</h2>
              <p className="step-hint">We'll schedule your calendar accordingly. Start realistic — consistency beats frequency.</p>
              <div className="frequency-list">
                {profile.platforms.map(p => {
                  const pd = PLATFORMS[p];
                  return (
                    <div key={p} className="frequency-row">
                      <div className="freq-platform" style={{ '--platform-color': pd.color }}>
                        <span>{pd.icon}</span>
                        <span>{pd.name}</span>
                      </div>
                      <div className="freq-controls">
                        <button onClick={() => setProfile(prev => ({
                          ...prev,
                          frequency: { ...prev.frequency, [p]: Math.max(1, (prev.frequency[p] || 3) - 1) }
                        }))}>−</button>
                        <span className="freq-value">{profile.frequency[p] || 3}</span>
                        <button onClick={() => setProfile(prev => ({
                          ...prev,
                          frequency: { ...prev.frequency, [p]: Math.min(pd.maxPerWeek, (prev.frequency[p] || 3) + 1) }
                        }))}>+</button>
                        <span className="freq-label">per week</span>
                      </div>
                      <div className="freq-tip">{pd.tips}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="step-panel">
              <h2>What are your content goals?</h2>
              <p className="step-hint">Select everything that applies — we'll tailor your strategy accordingly.</p>
              <div className="goals-grid">
                {GOALS.map(g => (
                  <button
                    key={g.id}
                    className={`goal-card ${profile.goals.includes(g.id) ? 'selected' : ''}`}
                    onClick={() => toggleGoal(g.id)}
                  >
                    <span className="goal-icon">{g.icon}</span>
                    <span className="goal-label">{g.label}</span>
                    {profile.goals.includes(g.id) && <span className="check">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="step-nav">
          {step > 0 && (
            <button className="btn-secondary" onClick={() => setStep(s => s - 1)}>
              Back
            </button>
          )}
          <button
            className="btn-primary"
            onClick={next}
            disabled={!canNext()}
          >
            {step === STEPS.length - 1 ? '🚀 Build My Strategy' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  );
}
