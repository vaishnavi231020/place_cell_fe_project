/**
 * Admin Interviews Management Page - Connected to Firestore
 */

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Clock, MapPin, Video, Building2, Users, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useInterviews } from '@/hooks/useFirestore';
import { addInterview, deleteInterview, updateInterview } from '@/lib/firestoreService';

const AdminInterviews: React.FC = () => {
  const { interviews, loading } = useInterviews();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [newInterview, setNewInterview] = useState({
    companyName: '', date: '', time: '',
    mode: 'Offline' as 'Online' | 'Offline',
    location: '', round: ''
  });

  const handleAddInterview = async () => {
    if (!newInterview.companyName || !newInterview.date || !newInterview.time) {
      toast({ title: 'Error', description: 'Please fill required fields', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await addInterview({
        companyName: newInterview.companyName,
        date: newInterview.date,
        time: newInterview.time,
        mode: newInterview.mode,
        location: newInterview.location,
        round: newInterview.round,
        status: 'Upcoming'
      });
      setNewInterview({ companyName: '', date: '', time: '', mode: 'Offline', location: '', round: '' });
      setIsAddDialogOpen(false);
      toast({ title: 'Success', description: 'Interview scheduled successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteInterview(id);
      toast({ title: 'Deleted', description: 'Interview removed' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleStatusChange = async (id: string, status: 'Upcoming' | 'Ongoing' | 'Completed') => {
    try {
      await updateInterview(id, { status });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const upcomingCount = interviews.filter(i => i.status === 'Upcoming').length;
  const completedCount = interviews.filter(i => i.status === 'Completed').length;

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center"><Calendar className="w-5 h-5 text-primary" /></div><div><p className="text-2xl font-bold">{upcomingCount}</p><p className="text-xs text-muted-foreground">Upcoming</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center"><Clock className="w-5 h-5 text-success" /></div><div><p className="text-2xl font-bold">{completedCount}</p><p className="text-xs text-muted-foreground">Completed</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-info/20 flex items-center justify-center"><Users className="w-5 h-5 text-info" /></div><div><p className="text-2xl font-bold">{interviews.length}</p><p className="text-xs text-muted-foreground">Total Interviews</p></div></CardContent></Card>
      </div>

      <div className="flex justify-end">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild><Button className="bg-primary"><Plus className="w-4 h-4 mr-2" />Schedule Interview</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Schedule New Interview</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2"><Label>Company Name *</Label><Input value={newInterview.companyName} onChange={(e) => setNewInterview({ ...newInterview, companyName: e.target.value })} placeholder="e.g., TCS" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Date *</Label><Input type="date" value={newInterview.date} onChange={(e) => setNewInterview({ ...newInterview, date: e.target.value })} /></div>
                <div className="space-y-2"><Label>Time *</Label><Input type="time" value={newInterview.time} onChange={(e) => setNewInterview({ ...newInterview, time: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Mode</Label><Select value={newInterview.mode} onValueChange={(value: 'Online' | 'Offline') => setNewInterview({ ...newInterview, mode: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Offline">Offline</SelectItem><SelectItem value="Online">Online</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Round</Label><Input value={newInterview.round} onChange={(e) => setNewInterview({ ...newInterview, round: e.target.value })} placeholder="e.g., Technical Round" /></div>
              </div>
              <div className="space-y-2"><Label>Location/Link</Label><Input value={newInterview.location} onChange={(e) => setNewInterview({ ...newInterview, location: e.target.value })} placeholder={newInterview.mode === 'Online' ? 'Meeting link' : 'Venue'} /></div>
              <Button onClick={handleAddInterview} className="w-full" disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Scheduling...</> : 'Schedule Interview'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Company</TableHead><TableHead>Date & Time</TableHead><TableHead>Round</TableHead><TableHead>Mode</TableHead><TableHead>Location</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {interviews.map((interview) => (
                <TableRow key={interview.id}>
                  <TableCell><div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-muted-foreground" /><span className="font-medium">{interview.companyName}</span></div></TableCell>
                  <TableCell><div><p>{interview.date ? new Date(interview.date).toLocaleDateString() : 'N/A'}</p><p className="text-sm text-muted-foreground">{interview.time}</p></div></TableCell>
                  <TableCell>{interview.round}</TableCell>
                  <TableCell>
                    <Badge variant={interview.mode === 'Online' ? 'secondary' : 'outline'}>
                      {interview.mode === 'Online' ? <Video className="w-3 h-3 mr-1" /> : <MapPin className="w-3 h-3 mr-1" />}
                      {interview.mode}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate">{interview.location}</TableCell>
                  <TableCell>
                    <Select value={interview.status} onValueChange={(v) => handleStatusChange(interview.id!, v as any)}>
                      <SelectTrigger className="w-[120px] h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Upcoming">Upcoming</SelectItem>
                        <SelectItem value="Ongoing">Ongoing</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(interview.id!)}><Trash2 className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {interviews.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No interviews scheduled</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminInterviews;
