/**
 * Dashboard Header Component
 * 
 * FEATURES:
 * - Page title display
 * - User greeting
 * - Notification bell
 * - Mobile menu toggle
 */

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ title, subtitle, onMenuClick }) => {
  const { userData } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const isAdmin = userData?.role === 'ADMIN';

  return (
    <header className="bg-card/50 backdrop-blur-sm border-b border-border sticky top-0 z-40">
      <div className="px-4 md:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuClick}
          >
            <Menu className="w-5 h-5" />
          </Button>

          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Greeting - Hidden on mobile */}
          <div className="hidden md:block text-right">
            <p className="text-sm text-muted-foreground">{getGreeting()},</p>
            <p className="text-sm font-medium text-foreground">{userData?.name || 'User'}</p>
          </div>

          {/* Notification Bell */}
          <Link
            to={isAdmin ? '/admin/notifications' : '/dashboard/notifications'}
            className="relative"
          >
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {/* Notification dot */}
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
