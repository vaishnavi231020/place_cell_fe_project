/**
 * Admin Job Postings Management Page - Connected to Firestore
 */

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Briefcase, Building2, MapPin, IndianRupee, Calendar, Users, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useJobPostings, useAllApplications } from '@/hooks/useFirestore';
import { addJobPosting, deleteJobPosting, updateJobPosting } from '@/lib/firestoreService';
import { BRANCH_OPTIONS } from '@/types';

const AdminJobPostings: React.FC = () => {
  const { jobPostings: jobs, loading } = useJobPostings();
  const { applications } = useAllApplications();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [newJob, setNewJob] = useState({
    title: '', companyName: '', location: '', package: '',
    minCGPA: '', maxBacklogs: '', deadline: '', description: '',
    eligibleBranches: [] as string[]
  });

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.companyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getApplicationCount = (jobId?: string, companyName?: string) => {
    if (jobId) return applications.filter(a => a.jobPostingId === jobId).length;
    if (companyName) return applications.filter(a => a.companyName === companyName).length;
    return 0;
  };

  const handleAddJob = async () => {
    if (!newJob.title || !newJob.companyName) {
      toast({ title: 'Error', description: 'Please fill required fields', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await addJobPosting({
        title: newJob.title,
        companyName: newJob.companyName,
        location: newJob.location,
        package: newJob.package,
        eligibleBranches: newJob.eligibleBranches.length > 0 ? newJob.eligibleBranches : [...BRANCH_OPTIONS],
        minCGPA: parseFloat(newJob.minCGPA) || 0,
        maxBacklogs: parseInt(newJob.maxBacklogs) || 0,
        deadline: newJob.deadline,
        description: newJob.description,
        status: 'Active'
      });
      setNewJob({ title: '', companyName: '', location: '', package: '', minCGPA: '', maxBacklogs: '', deadline: '', description: '', eligibleBranches: [] });
      setIsAddDialogOpen(false);
      toast({ title: 'Success', description: 'Job posting created successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteJob = async (id: string) => {
    try {
      await deleteJobPosting(id);
      toast({ title: 'Deleted', description: 'Job posting removed' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const activeJobs = jobs.filter(j => j.status === 'Active').length;

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center"><Briefcase className="w-5 h-5 text-primary" /></div><div><p className="text-2xl font-bold">{jobs.length}</p><p className="text-xs text-muted-foreground">Total Postings</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center"><Briefcase className="w-5 h-5 text-success" /></div><div><p className="text-2xl font-bold">{activeJobs}</p><p className="text-xs text-muted-foreground">Active Postings</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-info/20 flex items-center justify-center"><Users className="w-5 h-5 text-info" /></div><div><p className="text-2xl font-bold">{applications.length}</p><p className="text-xs text-muted-foreground">Total Applications</p></div></CardContent></Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search job postings..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild><Button className="bg-primary"><Plus className="w-4 h-4 mr-2" />Add Job Posting</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Job Posting</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Job Title *</Label><Input value={newJob.title} onChange={(e) => setNewJob({ ...newJob, title: e.target.value })} placeholder="e.g., Software Developer" /></div>
                <div className="space-y-2"><Label>Company *</Label><Input value={newJob.companyName} onChange={(e) => setNewJob({ ...newJob, companyName: e.target.value })} placeholder="e.g., TCS" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Location</Label><Input value={newJob.location} onChange={(e) => setNewJob({ ...newJob, location: e.target.value })} placeholder="e.g., Mumbai" /></div>
                <div className="space-y-2"><Label>Package</Label><Input value={newJob.package} onChange={(e) => setNewJob({ ...newJob, package: e.target.value })} placeholder="e.g., 7 LPA" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Min CGPA</Label><Input type="number" step="0.1" value={newJob.minCGPA} onChange={(e) => setNewJob({ ...newJob, minCGPA: e.target.value })} placeholder="6.0" /></div>
                <div className="space-y-2"><Label>Max Backlogs</Label><Input type="number" value={newJob.maxBacklogs} onChange={(e) => setNewJob({ ...newJob, maxBacklogs: e.target.value })} placeholder="0" /></div>
                <div className="space-y-2"><Label>Deadline</Label><Input type="date" value={newJob.deadline} onChange={(e) => setNewJob({ ...newJob, deadline: e.target.value })} /></div>
              </div>
              <div className="space-y-2">
                <Label>Eligible Branches</Label>
                <div className="grid grid-cols-2 gap-2">
                  {BRANCH_OPTIONS.map(branch => (
                    <div key={branch} className="flex items-center space-x-2">
                      <Checkbox id={`job-${branch}`} checked={newJob.eligibleBranches.includes(branch)} onCheckedChange={(checked) => {
                        setNewJob(prev => ({ ...prev, eligibleBranches: checked ? [...prev.eligibleBranches, branch] : prev.eligibleBranches.filter(b => b !== branch) }));
                      }} />
                      <label htmlFor={`job-${branch}`} className="text-sm">{branch}</label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={newJob.description} onChange={(e) => setNewJob({ ...newJob, description: e.target.value })} placeholder="Job description..." rows={3} /></div>
              <Button onClick={handleAddJob} className="w-full" disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Create Job Posting'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredJobs.map((job) => (
          <Card key={job.id} className="hover-glow transition-all duration-300">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center"><Building2 className="w-6 h-6 text-primary" /></div>
                  <div><h3 className="font-semibold">{job.title}</h3><p className="text-sm text-muted-foreground">{job.companyName}</p></div>
                </div>
                <Badge variant={job.status === 'Active' ? 'default' : 'secondary'}>{job.status}</Badge>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="w-4 h-4" />{job.location || 'N/A'}</div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><IndianRupee className="w-4 h-4" />{job.package || 'N/A'}</div>
                {job.deadline && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Calendar className="w-4 h-4" />Deadline: {new Date(job.deadline).toLocaleDateString()}</div>}
              </div>
              <div className="flex flex-wrap gap-1 mb-4">
                <Badge variant="outline" className="text-xs">CGPA ≥ {job.minCGPA}</Badge>
                <Badge variant="outline" className="text-xs">Backlogs ≤ {job.maxBacklogs}</Badge>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-1 text-sm"><Users className="w-4 h-4 text-muted-foreground" /><span className="font-medium">{getApplicationCount(job.id, job.companyName)}</span><span className="text-muted-foreground">applications</span></div>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteJob(job.id!)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredJobs.length === 0 && (
          <div className="col-span-2 text-center py-12 text-muted-foreground">No job postings found. Create your first one!</div>
        )}
      </div>
    </div>
  );
};

export default AdminJobPostings;
