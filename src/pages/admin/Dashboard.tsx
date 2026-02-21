/**
 * Admin Dashboard - Connected to Firestore for real stats
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, Building2, FileText, Calendar, Bell, CheckCircle, Clock,
  TrendingUp, Briefcase, UserCheck, Loader2
} from 'lucide-react';
import { fetchAdminStats } from '@/lib/firestoreService';
import { useAllApplications, useInterviews, useCompanies, useJobPostings } from '@/hooks/useFirestore';

const AdminDashboard: React.FC = () => {
  const { companies } = useCompanies();
  const { jobPostings } = useJobPostings();
  const { applications } = useAllApplications();
  const { interviews } = useInterviews();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminStats().then((data) => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  const computedStats = {
    totalStudents: stats?.totalStudents || 0,
    totalCompanies: companies.length,
    activeJobPostings: jobPostings.filter(j => j.status === 'Active').length,
    totalApplications: applications.length,
    scheduledInterviews: interviews.filter(i => i.status === 'Upcoming').length,
    selectedStudents: applications.filter(a => a.status === 'Selected').length,
    pendingResumes: stats?.pendingResumes || 0,
    placementRate: stats?.placementRate || 0
  };

  // Recent applications as activities
  const recentActivities = applications.slice(0, 5).map(app => ({
    text: `${app.userName} applied to ${app.companyName} for ${app.position}`,
    time: app.appliedAt?.toDate ? app.appliedAt.toDate().toLocaleString() : 'Recently',
    type: 'application'
  }));

  const upcomingInterviews = interviews
    .filter(i => i.status === 'Upcoming')
    .slice(0, 3)
    .map(i => ({
      company: i.companyName,
      date: i.date ? new Date(i.date).toLocaleDateString() : 'TBD',
      time: i.time || ''
    }));

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: computedStats.totalStudents, icon: Users, color: 'text-primary bg-primary/20' },
          { label: 'Companies', value: computedStats.totalCompanies, icon: Building2, color: 'text-info bg-info/20' },
          { label: 'Job Postings', value: computedStats.activeJobPostings, icon: Briefcase, color: 'text-warning bg-warning/20' },
          { label: 'Applications', value: computedStats.totalApplications, icon: FileText, color: 'text-accent bg-accent/20' },
          { label: 'Interviews', value: computedStats.scheduledInterviews, icon: Calendar, color: 'text-purple-500 bg-purple-500/20' },
          { label: 'Selected', value: computedStats.selectedStudents, icon: CheckCircle, color: 'text-success bg-success/20' },
          { label: 'Pending Resumes', value: computedStats.pendingResumes, icon: Clock, color: 'text-destructive bg-destructive/20' },
          { label: 'Placement Rate', value: `${computedStats.placementRate}%`, icon: TrendingUp, color: 'text-emerald-500 bg-emerald-500/20' },
        ].map((stat, i) => (
          <Card key={i} className="hover-glow transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-gradient-card border-border">
        <CardHeader><CardTitle className="text-lg">Quick Actions</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Add Company', path: '/admin/companies', icon: Building2, color: 'bg-primary/10 hover:bg-primary/20' },
            { label: 'Add Job Posting', path: '/admin/job-postings', icon: Briefcase, color: 'bg-info/10 hover:bg-info/20' },
            { label: 'Send Notification', path: '/admin/notifications', icon: Bell, color: 'bg-warning/10 hover:bg-warning/20' },
            { label: 'Schedule Interview', path: '/admin/interviews', icon: Calendar, color: 'bg-accent/10 hover:bg-accent/20' },
          ].map((action, i) => (
            <Link key={i} to={action.path} className={`p-4 rounded-xl ${action.color} transition-all duration-200 text-center group`}>
              <action.icon className="w-8 h-8 mx-auto mb-2 text-foreground group-hover:scale-110 transition-transform" />
              <p className="text-sm font-medium">{action.label}</p>
            </Link>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Applications</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link to="/admin/applications">View All</Link></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivities.length === 0 && <p className="text-center py-8 text-muted-foreground">No recent applications</p>}
            {recentActivities.map((activity, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <div className="w-2 h-2 rounded-full mt-2 bg-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{activity.text}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Upcoming Interviews</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link to="/admin/interviews">View All</Link></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingInterviews.length === 0 && <p className="text-center py-8 text-muted-foreground">No upcoming interviews</p>}
            {upcomingInterviews.map((interview, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center"><Building2 className="w-5 h-5 text-primary" /></div>
                  <div>
                    <p className="font-medium text-foreground">{interview.company}</p>
                    <p className="text-sm text-muted-foreground">{interview.date} {interview.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
