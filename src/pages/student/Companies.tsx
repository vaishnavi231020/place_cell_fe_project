/**
 * Student Companies Page - Reads from Firestore, allows applying
 */

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Building2, MapPin, IndianRupee, Search, CheckCircle, XCircle, Briefcase, Filter, Users, Loader2 } from 'lucide-react';
import { useCompanies, useUserApplications } from '@/hooks/useFirestore';
import { addApplication } from '@/lib/firestoreService';

const Companies: React.FC = () => {
  const { userData, currentUser } = useAuth();
  const { toast } = useToast();
  const { companies, loading } = useCompanies();
  const { applications: myApplications } = useUserApplications(currentUser?.uid);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEligibleOnly, setShowEligibleOnly] = useState(false);
  const [applyingTo, setApplyingTo] = useState<string | null>(null);

  const activeCompanies = companies.filter(c => c.status === 'Active');

  const checkEligibility = (company: any): boolean => {
    if (!userData) return false;
    const cgpa = userData.cgpa || 0;
    const backlogs = userData.backlogs || 0;
    const branch = userData.branch || '';
    return (
      cgpa >= (company.minCGPA || 0) &&
      backlogs <= (company.maxBacklogs || 99) &&
      (company.allowedBranches?.includes(branch) || !company.allowedBranches?.length)
    );
  };

  const filteredCompanies = activeCompanies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          company.location.toLowerCase().includes(searchQuery.toLowerCase());
    if (showEligibleOnly) return matchesSearch && checkEligibility(company);
    return matchesSearch;
  });

  const hasApplied = (companyId: string) => myApplications.some(a => a.companyId === companyId);

  const handleApply = async (company: any) => {
    if (!currentUser || !userData) return;
    setApplyingTo(company.id);
    try {
      await addApplication({
        userId: currentUser.uid,
        userEmail: userData.email,
        userName: userData.name,
        companyId: company.id,
        companyName: company.name,
        position: company.industry || 'General',
        status: 'Applied'
      });
      toast({ title: 'Application Submitted', description: `You have successfully applied to ${company.name}` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setApplyingTo(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search companies or locations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-secondary/50" />
        </div>
        <Button variant={showEligibleOnly ? 'default' : 'outline'} onClick={() => setShowEligibleOnly(!showEligibleOnly)} className="gap-2">
          <Filter className="w-4 h-4" />{showEligibleOnly ? 'Showing Eligible Only' : 'Show Eligible Only'}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">Showing {filteredCompanies.length} of {activeCompanies.length} companies</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCompanies.map((company) => {
          const isEligible = checkEligibility(company);
          const applied = hasApplied(company.id!);
          const isApplying = applyingTo === company.id;

          return (
            <Card key={company.id} className={`bg-gradient-card border-border transition-all hover-glow ${!isEligible ? 'opacity-75' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center"><Building2 className="w-7 h-7 text-primary" /></div>
                    <div>
                      <h3 className="font-bold text-lg text-foreground">{company.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="w-3 h-3" />{company.location}</div>
                    </div>
                  </div>
                  <Badge variant={isEligible ? 'default' : 'secondary'} className={isEligible ? 'bg-success/20 text-success border-success/30' : 'bg-destructive/20 text-destructive border-destructive/30'}>
                    {isEligible ? <><CheckCircle className="w-3 h-3 mr-1" /> Eligible</> : <><XCircle className="w-3 h-3 mr-1" /> Not Eligible</>}
                  </Badge>
                </div>

                {company.description && <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{company.description}</p>}

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 rounded-lg bg-secondary/50"><IndianRupee className="w-4 h-4 mx-auto text-success mb-1" /><p className="text-sm font-semibold text-foreground">{company.package}</p><p className="text-xs text-muted-foreground">Package</p></div>
                  <div className="text-center p-3 rounded-lg bg-secondary/50"><Users className="w-4 h-4 mx-auto text-info mb-1" /><p className="text-sm font-semibold text-foreground">{company.openPositions || 0}</p><p className="text-xs text-muted-foreground">Positions</p></div>
                  <div className="text-center p-3 rounded-lg bg-secondary/50"><Briefcase className="w-4 h-4 mx-auto text-warning mb-1" /><p className="text-sm font-semibold text-foreground">{company.industry}</p><p className="text-xs text-muted-foreground">Industry</p></div>
                </div>

                <div className="p-3 rounded-lg bg-secondary/30 mb-4 flex flex-col gap-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Eligibility Criteria:</p>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${userData && (userData.cgpa || 0) >= (company.minCGPA || 0) ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>CGPA ≥ {company.minCGPA}</span>
                    <span className={`px-2 py-1 rounded text-xs ${userData && (userData.backlogs || 0) <= (company.maxBacklogs || 0) ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>Backlogs ≤ {company.maxBacklogs}</span>
                    <span className={`px-2 py-1 rounded text-xs ${userData && company.allowedBranches?.includes(userData.branch || '') ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>{company.allowedBranches?.length || 0} Branches</span>
                  </div>
                  <div className="flex items-center gap-4 *:text-sm *:text-muted-foreground *:first-letter: *:first-letter:font-semibold font-mono">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Job Role: {company.JobRole || 'General Role'}</p>
                  </div>
                </div>

                <Button className={`w-full ${isEligible && !applied ? 'bg-gradient-primary' : ''}`} disabled={!isEligible || applied || isApplying} onClick={() => handleApply(company)}>
                  {isApplying ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Applying...</> : applied ? <><CheckCircle className="w-4 h-4 mr-2" /> Already Applied</> : isEligible ? 'Apply Now' : 'Not Eligible'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredCompanies.length === 0 && (
        <div className="text-center py-12"><Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-medium text-foreground mb-2">No Companies Found</h3><p className="text-muted-foreground">{showEligibleOnly ? 'No companies match your eligibility criteria.' : 'No companies available yet.'}</p></div>
      )}
    </div>
  );
};

export default Companies;
