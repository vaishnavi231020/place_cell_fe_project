/**
 * Student Applications Page - Connected to Firestore
 */

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Calendar, Clock, CheckCircle, XCircle, AlertCircle, FileText, Loader2 } from 'lucide-react';
import { ApplicationStatus } from '@/types';
import { useUserApplications } from '@/hooks/useFirestore';

const Applications: React.FC = () => {
  const { currentUser } = useAuth();
  const { applications, loading } = useUserApplications(currentUser?.uid);
  const [activeTab, setActiveTab] = useState<'all' | ApplicationStatus>('all');

  const filteredApplications = activeTab === 'all'
    ? applications
    : applications.filter(app => app.status === activeTab);

  const getStatusIcon = (status: ApplicationStatus) => {
    switch (status) {
      case 'Selected': return <CheckCircle className="w-4 h-4" />;
      case 'Rejected': return <XCircle className="w-4 h-4" />;
      case 'Shortlisted': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusClass = (status: ApplicationStatus) => {
    switch (status) {
      case 'Selected': return 'status-selected';
      case 'Rejected': return 'status-rejected';
      case 'Shortlisted': return 'status-shortlisted';
      default: return 'status-applied';
    }
  };

  const statusCounts = {
    all: applications.length,
    Applied: applications.filter(a => a.status === 'Applied').length,
    Shortlisted: applications.filter(a => a.status === 'Shortlisted').length,
    Selected: applications.filter(a => a.status === 'Selected').length,
    Rejected: applications.filter(a => a.status === 'Rejected').length
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Recently';
    if (timestamp?.toDate) return timestamp.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (timestamp instanceof Date) return timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-card border-border"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-info">{statusCounts.Applied}</p><p className="text-sm text-muted-foreground">Applied</p></CardContent></Card>
        <Card className="bg-gradient-card border-border"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-warning">{statusCounts.Shortlisted}</p><p className="text-sm text-muted-foreground">Shortlisted</p></CardContent></Card>
        <Card className="bg-gradient-card border-border"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-success">{statusCounts.Selected}</p><p className="text-sm text-muted-foreground">Selected</p></CardContent></Card>
        <Card className="bg-gradient-card border-border"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-destructive">{statusCounts.Rejected}</p><p className="text-sm text-muted-foreground">Rejected</p></CardContent></Card>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
          <TabsTrigger value="Applied">Applied</TabsTrigger>
          <TabsTrigger value="Shortlisted">Shortlisted</TabsTrigger>
          <TabsTrigger value="Selected">Selected</TabsTrigger>
          <TabsTrigger value="Rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="space-y-4">
            {filteredApplications.map((application) => (
              <Card key={application.id} className="bg-gradient-card border-border hover-glow">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center"><Building2 className="w-6 h-6 text-primary" /></div>
                      <div>
                        <h3 className="font-semibold text-foreground">{application.companyName}</h3>
                        <p className="text-sm text-muted-foreground">{application.position}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Applied on</p>
                        <p className="text-sm text-foreground">{formatDate(application.appliedAt)}</p>
                      </div>
                      <Badge className={`${getStatusClass(application.status)} flex items-center gap-1`}>
                        {getStatusIcon(application.status)}{application.status}
                      </Badge>
                    </div>
                  </div>

                  {application.status === 'Selected' && (
                    <div className="mt-4 p-3 rounded-lg bg-success/10 border border-success/30">
                      <div className="flex items-center gap-2 text-success"><CheckCircle className="w-4 h-4" /><span className="text-sm font-medium">Congratulations! You've been selected!</span></div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {filteredApplications.length === 0 && (
              <div className="text-center py-12"><FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-medium text-foreground mb-2">No Applications Found</h3><p className="text-muted-foreground">{activeTab === 'all' ? "You haven't applied to any companies yet." : `No applications with "${activeTab}" status.`}</p></div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Applications;
