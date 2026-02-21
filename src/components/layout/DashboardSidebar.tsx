/**
 * Dashboard Sidebar Component
 * 
 * FEATURES:
 * - Collapsible sidebar navigation
 * - Different menus for Student vs Admin roles
 * - Active route highlighting
 * - Logout functionality
 * - Responsive design
 */

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  LayoutDashboard,
  User,
  Building2,
  FileText,
  Calendar,
  Bell,
  FileCheck,
  CheckCircle,
  LogOut,
  Users,
  Settings,
  GraduationCap,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

// Student navigation items
const studentNavItems = [
  { title: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { title: 'My Profile', path: '/dashboard/profile', icon: User },
  { title: 'Companies', path: '/dashboard/companies', icon: Building2 },
  { title: 'My Applications', path: '/dashboard/applications', icon: FileText },
  { title: 'Interviews', path: '/dashboard/interviews', icon: Calendar },
  { title: 'AI Practice', path: '/dashboard/practice-interview', icon: GraduationCap },
  { title: 'Notifications', path: '/dashboard/notifications', icon: Bell },
  { title: 'Resume Status', path: '/dashboard/resume', icon: FileCheck },
  { title: 'Eligibility', path: '/dashboard/eligibility', icon: CheckCircle },
];

// Admin navigation items
const adminNavItems = [
  { title: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { title: 'Companies', path: '/admin/companies', icon: Building2 },
  { title: 'Students', path: '/admin/students', icon: Users },
  { title: 'Applications', path: '/admin/applications', icon: FileText },
  { title: 'Interviews', path: '/admin/interviews', icon: Calendar },
  { title: 'Notifications', path: '/admin/notifications', icon: Bell },
  { title: 'Settings', path: '/admin/settings', icon: Settings },
];

const DashboardSidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { userData, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isAdmin = userData?.role === 'ADMIN';
  const navItems = isAdmin ? adminNavItems : studentNavItems;

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: 'Logged Out',
        description: 'You have been logged out successfully'
      });
      navigate('/login');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to logout',
        variant: 'destructive'
      });
    }
  };

  const isActive = (path: string) => {
    if (path === '/dashboard' || path === '/admin') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 z-50 flex flex-col',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo Section */}
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        <Link to={isAdmin ? '/admin' : '/dashboard'} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-primary" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="font-bold text-foreground text-sm">Placement Portal</h1>
              <p className="text-xs text-muted-foreground capitalize">{userData?.role || 'Student'}</p>
            </div>
          )}
        </Link>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors text-muted-foreground"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'sidebar-item',
              isActive(item.path) && 'active'
            )}
            title={collapsed ? item.title : undefined}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && (
              <span className="animate-fade-in truncate">{item.title}</span>
            )}
          </Link>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="p-2 border-t border-sidebar-border">
        {!collapsed && userData && (
          <div className="px-4 py-3 mb-2 animate-fade-in">
            <p className="text-sm font-medium text-foreground truncate">{userData.name}</p>
            <p className="text-xs text-muted-foreground truncate">{userData.email}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="sidebar-item w-full text-destructive hover:bg-destructive/10"
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="animate-fade-in">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
