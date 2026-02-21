/**
 * Dashboard Layout Component
 * 
 * ARCHITECTURE:
 * - Wraps all dashboard pages with sidebar and header
 * - Manages sidebar collapsed state
 * - Handles responsive layout
 * - Uses Outlet for nested routes
 */

import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import DashboardSidebar from './DashboardSidebar';
import DashboardHeader from './DashboardHeader';
import { cn } from '@/lib/utils';

// Route to title mapping
const routeTitles: Record<string, { title: string; subtitle?: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Overview of your placement journey' },
  '/dashboard/profile': { title: 'My Profile', subtitle: 'Manage your personal information' },
  '/dashboard/companies': { title: 'Companies', subtitle: 'Browse and apply to companies' },
  '/dashboard/applications': { title: 'My Applications', subtitle: 'Track your job applications' },
  '/dashboard/interviews': { title: 'Upcoming Interviews', subtitle: 'Scheduled interview sessions' },
  '/dashboard/notifications': { title: 'Notifications', subtitle: 'Stay updated with alerts' },
  '/dashboard/resume': { title: 'Resume Status', subtitle: 'Track your resume verification' },
  '/dashboard/eligibility': { title: 'Eligibility Status', subtitle: 'Check your eligibility criteria' },
  '/admin': { title: 'Admin Dashboard', subtitle: 'Placement management overview' },
  '/admin/companies': { title: 'Manage Companies', subtitle: 'Add and edit company listings' },
  '/admin/students': { title: 'Manage Students', subtitle: 'View and manage student profiles' },
  '/admin/applications': { title: 'Applications', subtitle: 'Review student applications' },
  '/admin/interviews': { title: 'Interviews', subtitle: 'Schedule and manage interviews' },
  '/admin/notifications': { title: 'Notifications', subtitle: 'Send alerts to students' },
  '/admin/settings': { title: 'Settings', subtitle: 'Portal configuration' },
};

const DashboardLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Get page title based on current route
  const pageInfo = routeTitles[location.pathname] || { title: 'Dashboard' };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        'md:block',
        mobileMenuOpen ? 'block' : 'hidden'
      )}>
        <DashboardSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Main Content */}
      <main
        className={cn(
          'transition-all duration-300 min-h-screen',
          sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
        )}
      >
        <DashboardHeader
          title={pageInfo.title}
          subtitle={pageInfo.subtitle}
          onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        {/* Page Content */}
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
