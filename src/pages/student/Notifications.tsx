/**
 * Student Notifications Page - Connected to Firestore
 */

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Calendar, FileText, Award, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { useNotifications } from '@/hooks/useFirestore';
import { NotificationType } from '@/types';

const Notifications: React.FC = () => {
  const { userData } = useAuth();
  const { notifications: allNotifications, loading } = useNotifications();

  // Filter notifications relevant to this student
  const myNotifications = allNotifications.filter(n => {
    const branchMatch = !n.targetBranch || n.targetBranch === 'all' || n.targetBranch === userData?.branch;
    const yearMatch = !n.targetYear || n.targetYear === 'all' || n.targetYear === String(userData?.year);
    return branchMatch && yearMatch;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Interview': return Calendar;
      case 'Resume': return FileText;
      case 'Placement': return Award;
      case 'Document': return AlertCircle;
      default: return Bell;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Interview': return 'text-info bg-info/20';
      case 'Resume': return 'text-success bg-success/20';
      case 'Placement': return 'text-warning bg-warning/20';
      case 'Document': return 'text-destructive bg-destructive/20';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Recently';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="bg-primary/20 text-primary">
          {myNotifications.length} notifications
        </Badge>
      </div>

      <div className="space-y-3">
        {myNotifications.map((notification) => {
          const Icon = getTypeIcon(notification.type);
          return (
            <Card key={notification.id} className="bg-gradient-card border-border transition-all">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getTypeColor(notification.type)}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground">{notification.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="w-3 h-3" />{formatTimeAgo(notification.createdAt)}</span>
                      <Badge variant="outline" className="text-xs">{notification.type}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {myNotifications.length === 0 && (
        <div className="text-center py-12"><Bell className="w-16 h-16 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-medium text-foreground mb-2">No Notifications</h3><p className="text-muted-foreground">You're all caught up! No new notifications.</p></div>
      )}
    </div>
  );
};

export default Notifications;
