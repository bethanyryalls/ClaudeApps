import { useState } from 'react';
import { useLocalStorage } from './hooks/useStorage.js';
import { generateSchedule } from './utils/scheduleGenerator.js';
import Onboarding from './views/Onboarding.jsx';
import Dashboard from './views/Dashboard.jsx';
import CalendarView from './views/CalendarView.jsx';
import ShotLists from './views/ShotLists.jsx';
import BatchTips from './views/BatchTips.jsx';
import Navigation from './components/Navigation.jsx';

export default function App() {
  const [profile, setProfile] = useLocalStorage('csp_profile', null);
  const [posts, setPosts] = useLocalStorage('csp_posts', []);
  const [view, setView] = useState('dashboard');
  const [selectedPost, setSelectedPost] = useState(null);

  const handleOnboardingComplete = (newProfile) => {
    const schedule = generateSchedule(newProfile, 6);
    setProfile({ ...newProfile, setupComplete: true });
    setPosts(schedule);
    setView('dashboard');
  };

  const handleReset = () => {
    if (window.confirm('This will clear your entire strategy and start fresh. Are you sure?')) {
      setProfile(null);
      setPosts([]);
      setView('dashboard');
    }
  };

  if (!profile?.setupComplete) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="app-layout">
      <Navigation
        view={view}
        setView={setView}
        brandName={profile.brandName}
        onReset={handleReset}
      />
      <main className="main-content">
        {view === 'dashboard' && (
          <Dashboard
            profile={profile}
            posts={posts}
            setPosts={setPosts}
            setView={setView}
            setSelectedPost={setSelectedPost}
          />
        )}
        {view === 'calendar' && (
          <CalendarView
            posts={posts}
            setPosts={setPosts}
            setSelectedPost={setSelectedPost}
            setView={setView}
          />
        )}
        {view === 'shotlists' && (
          <ShotLists
            posts={posts}
            setPosts={setPosts}
            selectedPost={selectedPost}
            setSelectedPost={setSelectedPost}
          />
        )}
        {view === 'batch' && (
          <BatchTips posts={posts} />
        )}
      </main>
    </div>
  );
}
