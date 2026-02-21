/**
 * Student Dashboard - Connected to Firestore for real data
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, FileText, Calendar, Bell, ArrowRight, TrendingUp, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { useCompanies, useUserApplications, useInterviews, useNotifications } from '@/hooks/useFirestore';

const StudentDashboard: React.FC = () => {
  const { userData, currentUser } = useAuth();
  const { companies, loading: loadingCompanies } = useCompanies();
  const { applications, loading: loadingApps } = useUserApplications(currentUser?.uid);
  const { interviews, loading: loadingInterviews } = useInterviews();
  const { notifications } = useNotifications();

  const loading = loadingCompanies || loadingApps || loadingInterviews;

  const activeCompanies = companies.filter(c => c.status === 'Active');

  // Filter interviews relevant to this student
  const myInterviews = interviews.filter(i => {
    if (i.status === 'Completed') return false;
    const branchMatch = !i.targetBranch || i.targetBranch === 'all' || i.targetBranch === userData?.branch;
    const yearMatch = !i.targetYear || i.targetYear === 'all' || i.targetYear === String(userData?.year);
    return branchMatch && yearMatch;
  });

  // Filter notifications for this student
  const myNotifications = notifications.filter(n => {
    const branchMatch = !n.targetBranch || n.targetBranch === 'all' || n.targetBranch === userData?.branch;
    const yearMatch = !n.targetYear || n.targetYear === 'all' || n.targetYear === String(userData?.year);
    return branchMatch && yearMatch;
  });

  const stats = {
    totalCompanies: activeCompanies.length,
    appliedJobs: applications.length,
    scheduledInterviews: myInterviews.length,
    notifications: myNotifications.length
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Recently';
    if (timestamp?.toDate) return timestamp.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Welcome back, {userData?.name?.split(' ')[0] || 'Student'}! 👋</h2>
          <p className="text-muted-foreground">Here's what's happening with your placement journey</p>
        </div>
        <Button asChild className="bg-gradient-primary hover:opacity-90"><Link to="/dashboard/companies">Browse Companies<ArrowRight className="w-4 h-4 ml-2" /></Link></Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="stat-card hover-glow"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Companies</p><p className="text-3xl font-bold text-foreground mt-1">{stats.totalCompanies}</p></div><div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center"><Building2 className="w-6 h-6 text-primary" /></div></div></CardContent></Card>
        <Card className="stat-card hover-glow"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Applied</p><p className="text-3xl font-bold text-foreground mt-1">{stats.appliedJobs}</p></div><div className="w-12 h-12 rounded-full bg-info/20 flex items-center justify-center"><FileText className="w-6 h-6 text-info" /></div></div></CardContent></Card>
        <Card className="stat-card hover-glow"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Interviews</p><p className="text-3xl font-bold text-foreground mt-1">{stats.scheduledInterviews}</p></div><div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center"><Calendar className="w-6 h-6 text-warning" /></div></div></CardContent></Card>
        <Card className="stat-card hover-glow"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Notifications</p><p className="text-3xl font-bold text-foreground mt-1">{stats.notifications}</p></div><div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center"><Bell className="w-6 h-6 text-destructive" /></div></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-card border-border">
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-lg font-semibold">Upcoming Interviews</CardTitle><Link to="/dashboard/interviews" className="text-sm text-primary hover:underline">View all</Link></CardHeader>
          <CardContent className="space-y-4">
            {myInterviews.slice(0, 3).map((interview) => (
              <div key={interview.id} className="p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div><h4 className="font-medium text-foreground">{interview.companyName}</h4><p className="text-sm text-muted-foreground mt-1">{interview.round}</p></div>
                  <Badge className={interview.mode === 'Online' ? 'bg-info/20 text-info' : 'bg-warning/20 text-warning'}>{interview.mode}</Badge>
                </div>
                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{interview.date ? new Date(interview.date).toLocaleDateString() : 'TBD'}</span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{interview.time}</span>
                </div>
              </div>
            ))}
            {myInterviews.length === 0 && <p className="text-center text-muted-foreground py-8">No upcoming interviews</p>}
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border">
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-lg font-semibold">Recent Applications</CardTitle><Link to="/dashboard/applications" className="text-sm text-primary hover:underline">View all</Link></CardHeader>
          <CardContent className="space-y-4">
            {applications.slice(0, 3).map((application) => (
              <div key={application.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center"><Building2 className="w-5 h-5 text-primary" /></div>
                  <div><h4 className="font-medium text-foreground">{application.companyName}</h4><p className="text-xs text-muted-foreground">{formatDate(application.appliedAt)}</p></div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  application.status === 'Shortlisted' ? 'status-shortlisted' :
                  application.status === 'Selected' ? 'status-selected' :
                  application.status === 'Rejected' ? 'status-rejected' : 'status-applied'
                }`}>{application.status}</span>
              </div>
            ))}
            {applications.length === 0 && <p className="text-center text-muted-foreground py-8">No applications yet</p>}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-card border-border">
        <CardHeader><CardTitle className="text-lg font-semibold">Quick Actions</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/dashboard/profile" className="p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 transition-all text-center hover-glow"><div className="w-12 h-12 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-3"><FileText className="w-6 h-6 text-primary" /></div><p className="text-sm font-medium text-foreground">Update Profile</p></Link>
            <Link to="/dashboard/resume" className="p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 transition-all text-center hover-glow"><div className="w-12 h-12 mx-auto rounded-full bg-success/20 flex items-center justify-center mb-3"><CheckCircle className="w-6 h-6 text-success" /></div><p className="text-sm font-medium text-foreground">Check Resume</p></Link>
            <Link to="/dashboard/companies" className="p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 transition-all text-center hover-glow"><div className="w-12 h-12 mx-auto rounded-full bg-info/20 flex items-center justify-center mb-3"><Building2 className="w-6 h-6 text-info" /></div><p className="text-sm font-medium text-foreground">Find Jobs</p></Link>
            <Link to="/dashboard/eligibility" className="p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 transition-all text-center hover-glow"><div className="w-12 h-12 mx-auto rounded-full bg-warning/20 flex items-center justify-center mb-3"><TrendingUp className="w-6 h-6 text-warning" /></div><p className="text-sm font-medium text-foreground">Check Eligibility</p></Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentDashboard;
