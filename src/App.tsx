import React, { useState } from 'react';
import { Sidebar, TopBar, MobileNav } from './components/Navigation';
import { Dashboard } from './pages/Dashboard';
import { Comparison } from './pages/Comparison';
import { Profile } from './pages/Profile';
import { Calendar } from './pages/Calendar';
import { Page, UserProfile } from './types';
import { DEFAULT_PROFILE } from './constants';

export default function App() {
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard profile={profile} setProfile={setProfile} />;
      case 'comparison':
        return <Comparison profile={profile} />;
      case 'calendar':
        return <Calendar profile={profile} />;
      case 'profile':
        return <Profile profile={profile} setProfile={setProfile} />;
      default:
        return <Dashboard profile={profile} setProfile={setProfile} />;
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        profile={profile} 
      />
      <TopBar />
      <main className="lg:ml-72 pt-24 px-6 lg:px-12 pb-32 lg:pb-16 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {renderPage()}
        </div>
      </main>
      <MobileNav 
        activePage={activePage} 
        setActivePage={setActivePage} 
      />
    </div>
  );
}
