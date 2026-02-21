/**
 * Admin Applications Management Page - Connected to Firestore
 */

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, CheckCircle, Clock, UserCheck, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAllApplications } from '@/hooks/useFirestore';
import { updateApplicationStatus, FirestoreApplication } from '@/lib/firestoreService';

const statusColors: Record<string, string> = {
  Applied: 'bg-blue-500/20 text-blue-500',
  Shortlisted: 'bg-warning/20 text-warning',
  Rejected: 'bg-destructive/20 text-destructive',
  Selected: 'bg-success/20 text-success',
};

const AdminApplications: React.FC = () => {
  const { applications, loading } = useAllApplications();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  const filteredApplications = applications.filter(app => {
    const matchesSearch =
      app.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = async (id: string, newStatus: FirestoreApplication['status']) => {
    try {
      await updateApplicationStatus(id, newStatus);
      toast({ title: 'Status Updated', description: `Application marked as ${newStatus}` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const stats = {
    total: applications.length,
    applied: applications.filter(a => a.status === 'Applied').length,
    shortlisted: applications.filter(a => a.status === 'Shortlisted').length,
    selected: applications.filter(a => a.status === 'Selected').length,
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center"><FileText className="w-5 h-5 text-primary" /></div><div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-info/20 flex items-center justify-center"><Clock className="w-5 h-5 text-info" /></div><div><p className="text-2xl font-bold">{stats.applied}</p><p className="text-xs text-muted-foreground">Pending</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center"><UserCheck className="w-5 h-5 text-warning" /></div><div><p className="text-2xl font-bold">{stats.shortlisted}</p><p className="text-xs text-muted-foreground">Shortlisted</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-success" /></div><div><p className="text-2xl font-bold">{stats.selected}</p><p className="text-xs text-muted-foreground">Selected</p></div></CardContent></Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search by student or company..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by status" /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="Applied">Applied</SelectItem><SelectItem value="Shortlisted">Shortlisted</SelectItem><SelectItem value="Selected">Selected</SelectItem><SelectItem value="Rejected">Rejected</SelectItem></SelectContent></Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Company</TableHead><TableHead>Position</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {filteredApplications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell><div><p className="font-medium">{app.userName}</p><p className="text-sm text-muted-foreground">{app.userEmail}</p></div></TableCell>
                  <TableCell className="font-medium">{app.companyName}</TableCell>
                  <TableCell>{app.position}</TableCell>
                  <TableCell><Badge className={statusColors[app.status]}>{app.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {app.status !== 'Selected' && <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus(app.id!, 'Shortlisted')} className="text-warning">Shortlist</Button>}
                      {app.status !== 'Selected' && <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus(app.id!, 'Selected')} className="text-success">Select</Button>}
                      {app.status !== 'Rejected' && <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus(app.id!, 'Rejected')} className="text-destructive">Reject</Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredApplications.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No applications found</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminApplications;
