/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AccessibilityUtilityBar, Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { ServiceDetailPage } from './pages/ServiceDetailPage';
import { MapPage } from './pages/MapPage';
import { AIMatchPage } from './pages/AIMatchPage';
import { AboutPage } from './pages/AboutPage';
import { AdminPage } from './pages/AdminPage';

function RouterView() {
  const { pathname } = useApp();

  // Separate dedicated Web Admin Console layout (/admin)
  if (pathname.startsWith('/admin')) {
    return <AdminPage />;
  }

  let content: React.ReactNode = <HomePage />;

  if (pathname === '/' || pathname === '') {
    content = <HomePage />;
  } else if (pathname.startsWith('/search')) {
    content = <SearchPage />;
  } else if (pathname.startsWith('/service/')) {
    const idStr = pathname.replace('/service/', '').split('/')[0];
    const id = Number(idStr);
    content = Number.isInteger(id) && id > 0 ? <ServiceDetailPage id={id} /> : <SearchPage />;
  } else if (pathname.startsWith('/map')) {
    content = <MapPage />;
  } else if (pathname.startsWith('/ai-match')) {
    content = <AIMatchPage />;
  } else if (pathname.startsWith('/about')) {
    content = <AboutPage />;
  } else {
    content = <HomePage />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9FC] text-[#0F172A]">
      <Navbar />
      <AccessibilityUtilityBar />
      <main className="flex-1">{content}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <RouterView />
    </AppProvider>
  );
}
