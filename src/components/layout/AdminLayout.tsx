/**
 * Admin Layout Component
 * 
 * Wraps all admin pages with sidebar and header
 */

import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { cn } from '@/lib/utils';

// Route to title mapping
const routeTitles: Record<string, { title: string; subtitle?: string }> = {
  '/admin': { title: 'Dashboard', subtitle: 'Placement management overview' },
  '/admin/companies': { title: 'Companies', subtitle: 'Manage company listings' },
  '/admin/students': { title: 'Students', subtitle: 'Manage student profiles' },
  '/admin/applications': { title: 'Applications', subtitle: 'Review student applications' },
  '/admin/interviews': { title: 'Interviews', subtitle: 'Schedule and manage interviews' },
  '/admin/notifications': { title: 'Notifications', subtitle: 'Send alerts to students' },
  '/admin/job-postings': { title: 'Job Postings', subtitle: 'Manage job openings' },
  '/admin/reports': { title: 'Reports', subtitle: 'Analytics and statistics' },
};

const AdminLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const pageInfo = routeTitles[location.pathname] || { title: 'Admin Panel' };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

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
        <AdminSidebar
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
        <AdminHeader
          title={pageInfo.title}
          subtitle={pageInfo.subtitle}
          onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
