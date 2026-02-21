/**
 * Student Interviews Page - Connected to Firestore
 */

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Video, Building2, ExternalLink, AlertCircle, Loader2 } from 'lucide-react';
import { useInterviews } from '@/hooks/useFirestore';

const Interviews: React.FC = () => {
  const { userData } = useAuth();
  const { interviews, loading } = useInterviews();

  // Filter interviews relevant to this student (by branch/year or all)
  const myInterviews = interviews.filter(i => {
    if (i.status === 'Completed') return false; // Only show upcoming/ongoing
    // Show if targeting all or matching student's branch/year
    const branchMatch = !i.targetBranch || i.targetBranch === 'all' || i.targetBranch === userData?.branch;
    const yearMatch = !i.targetYear || i.targetYear === 'all' || i.targetYear === String(userData?.year);
    return branchMatch && yearMatch;
  });

  const sortedInterviews = [...myInterviews].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateA - dateB;
  });

  const getDaysUntil = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const interviewDate = new Date(dateStr);
    interviewDate.setHours(0, 0, 0, 0);
    return Math.ceil((interviewDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getUrgencyBadge = (dateStr: string) => {
    const days = getDaysUntil(dateStr);
    if (days <= 0) return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Today</Badge>;
    if (days === 1) return <Badge className="bg-warning/20 text-warning border-warning/30">Tomorrow</Badge>;
    if (days <= 3) return <Badge className="bg-info/20 text-info border-info/30">In {days} days</Badge>;
    return <Badge className="bg-muted text-muted-foreground border-muted">In {days} days</Badge>;
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="p-4 rounded-lg bg-info/10 border border-info/30 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Interview Preparation Tips</p>
          <p className="text-sm text-muted-foreground mt-1">Test your internet connection for online interviews. Arrive 15 minutes early for offline interviews.</p>
        </div>
      </div>

      <div className="space-y-4">
        {sortedInterviews.map((interview) => (
          <Card key={interview.id} className="bg-gradient-card border-border hover-glow overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                <div className="w-full md:w-32 p-4 bg-primary/10 flex md:flex-col items-center justify-center gap-2 border-b md:border-b-0 md:border-r border-border">
                  <Calendar className="w-6 h-6 text-primary" />
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{interview.date ? new Date(interview.date).getDate() : '-'}</p>
                    <p className="text-sm text-muted-foreground">{interview.date ? new Date(interview.date).toLocaleDateString('en-US', { month: 'short' }) : ''}</p>
                  </div>
                </div>

                <div className="flex-1 p-4">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center"><Building2 className="w-5 h-5 text-primary" /></div>
                        <div><h3 className="font-semibold text-foreground">{interview.companyName}</h3><p className="text-sm text-muted-foreground">{interview.round}</p></div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground"><Clock className="w-4 h-4" />{interview.time}</span>
                        <Badge variant="outline" className={interview.mode === 'Online' ? 'border-info/50 text-info' : 'border-warning/50 text-warning'}>
                          {interview.mode === 'Online' ? <><Video className="w-3 h-3 mr-1" /> Online</> : <><MapPin className="w-3 h-3 mr-1" /> Offline</>}
                        </Badge>
                      </div>

                      <div className="p-3 rounded-lg bg-secondary/50">
                        {interview.mode === 'Online' ? (
                          <div className="flex items-center gap-2"><Video className="w-4 h-4 text-info" /><a href={interview.location} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">Join Meeting<ExternalLink className="w-3 h-3" /></a></div>
                        ) : (
                          <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" /><p className="text-sm text-foreground">{interview.location}</p></div>
                        )}
                      </div>
                    </div>

                    <div className="flex md:flex-col items-center gap-2">
                      {interview.date && getUrgencyBadge(interview.date)}
                      {interview.mode === 'Online' && interview.location && (
                        <Button size="sm" asChild className="bg-gradient-primary"><a href={interview.location} target="_blank" rel="noopener noreferrer">Join Now</a></Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sortedInterviews.length === 0 && (
        <div className="text-center py-12"><Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-medium text-foreground mb-2">No Upcoming Interviews</h3><p className="text-muted-foreground">You don't have any interviews scheduled. Keep applying to companies!</p></div>
      )}
    </div>
  );
};

export default Interviews;
