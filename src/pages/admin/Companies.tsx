/**
 * Admin Companies Management Page - Connected to Firestore
 */

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Search, Edit, Trash2, Building2, MapPin, IndianRupee, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCompanies } from '@/hooks/useFirestore';
import { addCompany, deleteCompany, updateCompany } from '@/lib/firestoreService';
import { BRANCH_OPTIONS } from '@/types';
import { join } from 'path';

const AdminCompanies: React.FC = () => {
  const { companies, loading } = useCompanies();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [newCompany, setNewCompany] = useState({
    name: '', industry: '', location: '', package: '',
    minCGPA: '', maxBacklogs: '', openPositions: '', description: '', JobRole: '',
    allowedBranches: [] as string[], 
  });

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCompany = async () => {
    if (!newCompany.name || !newCompany.industry) {
      toast({ title: 'Error', description: 'Please fill required fields', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await addCompany({
        name: newCompany.name,
        industry: newCompany.industry,
        location: newCompany.location,
        package: newCompany.package,
        minCGPA: parseFloat(newCompany.minCGPA) || 0,
        maxBacklogs: parseInt(newCompany.maxBacklogs) || 0,
        openPositions: parseInt(newCompany.openPositions) || 0,
        allowedBranches: newCompany.allowedBranches.length > 0 ? newCompany.allowedBranches : [...BRANCH_OPTIONS],
        description: newCompany.description,
        status: 'Active',
        JobRole: newCompany.JobRole // Default empty, can be updated later
      });
      setNewCompany({ name: '', industry: '', location: '', package: '', minCGPA: '', maxBacklogs: '', openPositions: '', description: '', JobRole: '', allowedBranches: [] });
      setIsAddDialogOpen(false);
      toast({ title: 'Success', description: 'Company added successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCompany = async (id: string) => {
    try {
      await deleteCompany(id);
      toast({ title: 'Deleted', description: 'Company removed successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      await updateCompany(id, { status: currentStatus === 'Active' ? 'Inactive' : 'Active' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search companies..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-2" />Add Company</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add New Company</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Company Name *</Label><Input value={newCompany.name} onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })} placeholder="e.g., TCS" /></div>
                <div className="space-y-2"><Label>Industry *</Label><Input value={newCompany.industry} onChange={(e) => setNewCompany({ ...newCompany, industry: e.target.value })} placeholder="e.g., IT Services" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Location</Label><Input value={newCompany.location} onChange={(e) => setNewCompany({ ...newCompany, location: e.target.value })} placeholder="e.g., Mumbai" /></div>
                <div className="space-y-2"><Label>Package (LPA)</Label><Input value={newCompany.package} onChange={(e) => setNewCompany({ ...newCompany, package: e.target.value })} placeholder="e.g., 7 LPA" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Min CGPA</Label><Input type="number" step="0.1" value={newCompany.minCGPA} onChange={(e) => setNewCompany({ ...newCompany, minCGPA: e.target.value })} placeholder="6.0" /></div>
                <div className="space-y-2"><Label>Max Backlogs</Label><Input type="number" value={newCompany.maxBacklogs} onChange={(e) => setNewCompany({ ...newCompany, maxBacklogs: e.target.value })} placeholder="0" /></div>
                <div className="space-y-2"><Label>Positions</Label><Input type="number" value={newCompany.openPositions} onChange={(e) => setNewCompany({ ...newCompany, openPositions: e.target.value })} placeholder="50" /></div>
                <div className="space-y-2"><Label>Job Role</Label><Input value={newCompany.JobRole} onChange={(e) => setNewCompany({ ...newCompany, JobRole: e.target.value })} placeholder="e.g., Software Engineer" /></div>
              </div>
              <div className="space-y-2">
                <Label>Eligible Branches</Label>
                <div className="grid grid-cols-2 gap-2">
                  {BRANCH_OPTIONS.map(branch => (
                    <div key={branch} className="flex items-center space-x-2">
                      <Checkbox
                        id={branch}
                        checked={newCompany.allowedBranches.includes(branch)}
                        onCheckedChange={(checked) => {
                          setNewCompany(prev => ({
                            ...prev,
                            allowedBranches: checked
                              ? [...prev.allowedBranches, branch]
                              : prev.allowedBranches.filter(b => b !== branch)
                          }));
                        }}
                      />
                      <label htmlFor={branch} className="text-sm">{branch}</label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={newCompany.description} onChange={(e) => setNewCompany({ ...newCompany, description: e.target.value })} placeholder="Company description..." rows={3} /></div>
              <Button onClick={handleAddCompany} className="w-full" disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding...</> : 'Add Company'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-4"><div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center"><Building2 className="w-5 h-5 text-primary" /></div><div><p className="text-2xl font-bold">{companies.length}</p><p className="text-sm text-muted-foreground">Total Companies</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-4"><div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center"><Building2 className="w-5 h-5 text-success" /></div><div><p className="text-2xl font-bold">{companies.filter(c => c.status === 'Active').length}</p><p className="text-sm text-muted-foreground">Active Companies</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-4"><div className="w-10 h-10 rounded-lg bg-info/20 flex items-center justify-center"><IndianRupee className="w-5 h-5 text-info" /></div><div><p className="text-2xl font-bold">{companies.reduce((sum, c) => sum + (c.openPositions || 0), 0)}</p><p className="text-sm text-muted-foreground">Total Positions</p></div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Min CGPA</TableHead>
                <TableHead>Job Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell>{company.industry}</TableCell>
                  <TableCell><div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{company.location}</div></TableCell>
                  <TableCell>{company.package}</TableCell>
                  <TableCell>{company.minCGPA}</TableCell>
                  <TableCell>{company.JobRole}</TableCell>
                  <TableCell>
                    <Badge
                      variant={company.status === 'Active' ? 'default' : 'secondary'}
                      className="cursor-pointer"
                      onClick={() => handleToggleStatus(company.id!, company.status)}
                    >
                      {company.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteCompany(company.id!)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredCompanies.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No companies found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCompanies;
