/**
 * Admin Header with user info and logout
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, Bell, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick: () => void;
}

const AdminHeader: React.FC<HeaderProps> = ({ title, subtitle, onMenuClick }) => {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: 'Logged Out', description: 'You have been logged out successfully' });
      navigate('/login');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to logout', variant: 'destructive' });
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
            <Menu className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:block text-right mr-2">
            <p className="text-sm font-medium text-foreground">{userData?.name || 'Admin'}</p>
            <p className="text-xs text-muted-foreground">{userData?.email}</p>
          </div>

          <Button variant="ghost" size="icon" className="relative rounded-full h-10 w-10 overflow-hidden p-0">
            <img 
              // src={userData?.photoURL || '/default-avatar.png'}
              src="public/PP.jpeg"
              alt="Profile" 
              className="rounded-full object-cover h-full w-full" 
            />
          </Button>


          <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
