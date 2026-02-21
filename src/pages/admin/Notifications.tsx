/**
 * Admin Notifications Page - Connected to Firestore
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Send, Bell, Users, Clock, CheckCircle, Building2, Calendar, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/useFirestore';
import { addNotification } from '@/lib/firestoreService';
import { BRANCH_OPTIONS } from '@/types';

const AdminNotifications: React.FC = () => {
  const { notifications: sentNotifications, loading } = useNotifications();
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [notification, setNotification] = useState({
    title: '', message: '', type: 'Placement',
    targetBranch: 'all', targetYear: 'all'
  });

  const handleSendNotification = async () => {
    if (!notification.title || !notification.message) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const recipients = notification.targetBranch === 'all' && notification.targetYear === 'all'
        ? 'All Students'
        : `${notification.targetBranch !== 'all' ? notification.targetBranch : 'All Branches'}, Year ${notification.targetYear !== 'all' ? notification.targetYear : 'All'}`;

      await addNotification({
        title: notification.title,
        message: notification.message,
        type: notification.type,
        targetBranch: notification.targetBranch,
        targetYear: notification.targetYear,
        recipients
      });
      setNotification({ title: '', message: '', type: 'Placement', targetBranch: 'all', targetYear: 'all' });
      toast({ title: 'Notification Sent!', description: 'Your notification has been delivered' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const notificationTypes = [
    { value: 'Placement', label: 'Placement', icon: Building2 },
    { value: 'Interview', label: 'Interview', icon: Calendar },
    { value: 'Document', label: 'Document', icon: FileText },
    { value: 'Resume', label: 'Resume', icon: FileText },
  ];

  const getTypeIcon = (type: string) => {
    const found = notificationTypes.find(t => t.value === type);
    return found ? found.icon : Bell;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    if (timestamp?.toDate) return timestamp.toDate().toLocaleString();
    if (timestamp instanceof Date) return timestamp.toLocaleString();
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-card border-border">
          <CardHeader><CardTitle className="flex items-center gap-2"><Send className="w-5 h-5" />Send Notification</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Title *</Label><Input value={notification.title} onChange={(e) => setNotification({ ...notification, title: e.target.value })} placeholder="e.g., Campus Drive Announcement" /></div>
            <div className="space-y-2"><Label>Message *</Label><Textarea value={notification.message} onChange={(e) => setNotification({ ...notification, message: e.target.value })} placeholder="Enter your notification message..." rows={4} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Type</Label><Select value={notification.type} onValueChange={(value) => setNotification({ ...notification, type: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{notificationTypes.map(type => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Target Year</Label><Select value={notification.targetYear} onValueChange={(value) => setNotification({ ...notification, targetYear: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Years</SelectItem><SelectItem value="1">1st Year</SelectItem><SelectItem value="2">2nd Year</SelectItem><SelectItem value="3">3rd Year</SelectItem><SelectItem value="4">Final Year</SelectItem></SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label>Target Branch</Label><Select value={notification.targetBranch} onValueChange={(value) => setNotification({ ...notification, targetBranch: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Branches</SelectItem>{BRANCH_OPTIONS.map(branch => <SelectItem key={branch} value={branch}>{branch}</SelectItem>)}</SelectContent></Select></div>
            <Button onClick={handleSendNotification} className="w-full bg-primary" disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : <><Send className="w-4 h-4 mr-2" />Send Notification</>}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border">
          <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5" />Quick Templates</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { title: 'Campus Drive', message: 'A new company is visiting for campus recruitment. Check eligibility and apply now.', type: 'Placement' },
              { title: 'Interview Reminder', message: 'Your interview is scheduled for tomorrow. Please be on time and carry necessary documents.', type: 'Interview' },
              { title: 'Resume Deadline', message: 'Reminder to submit your updated resume before the deadline for upcoming drives.', type: 'Resume' },
              { title: 'Document Verification', message: 'Please submit your original documents for verification at the placement office.', type: 'Document' },
            ].map((template, i) => (
              <button key={i} onClick={() => setNotification({ ...notification, title: template.title, message: template.message, type: template.type })} className="w-full p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors text-left">
                <div className="flex items-center gap-2 mb-1"><Badge variant="outline" className="text-xs">{template.type}</Badge><span className="font-medium text-sm">{template.title}</span></div>
                <p className="text-xs text-muted-foreground line-clamp-2">{template.message}</p>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-card border-border">
        <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle className="w-5 h-5" />Recent Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {loading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}
          {!loading && sentNotifications.length === 0 && <p className="text-center py-8 text-muted-foreground">No notifications sent yet</p>}
          {sentNotifications.map((notif) => {
            const TypeIcon = getTypeIcon(notif.type);
            return (
              <div key={notif.id} className="p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0"><TypeIcon className="w-5 h-5 text-primary" /></div>
                    <div>
                      <h4 className="font-medium">{notif.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" />{notif.recipients}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(notif.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <Badge>{notif.type}</Badge>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminNotifications;
