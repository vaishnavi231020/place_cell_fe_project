/**
 * Eligibility Status Page - Connected to Firestore (real companies)
 */

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Award, AlertCircle, BookOpen, CheckCircle, XCircle, TrendingUp, Building2, Loader2 } from 'lucide-react';
import { useCompanies } from '@/hooks/useFirestore';

const EligibilityStatus: React.FC = () => {
  const { userData } = useAuth();
  const { companies, loading } = useCompanies();

  const cgpa = userData?.cgpa || 0;
  const backlogs = userData?.backlogs || 0;
  const branch = userData?.branch || 'Not specified';

  const activeCompanies = companies.filter(c => c.status === 'Active');

  const eligibilityResults = activeCompanies.map(company => ({
    name: company.name,
    minCGPA: company.minCGPA || 0,
    maxBacklogs: company.maxBacklogs || 0,
    cgpaEligible: cgpa >= (company.minCGPA || 0),
    backlogsEligible: backlogs <= (company.maxBacklogs || 0),
    branchEligible: company.allowedBranches?.includes(branch) || !company.allowedBranches?.length,
    isEligible: cgpa >= (company.minCGPA || 0) && backlogs <= (company.maxBacklogs || 0) && (company.allowedBranches?.includes(branch) || !company.allowedBranches?.length)
  }));

  const eligibleCount = eligibilityResults.filter(r => r.isEligible).length;

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <Card className="bg-gradient-card border-border">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${eligibleCount > activeCompanies.length * 0.6 ? 'bg-success/20' : eligibleCount > activeCompanies.length * 0.3 ? 'bg-warning/20' : 'bg-destructive/20'}`}>
                {eligibleCount > activeCompanies.length * 0.6 ? <CheckCircle className="w-8 h-8 text-success" /> : eligibleCount > activeCompanies.length * 0.3 ? <AlertCircle className="w-8 h-8 text-warning" /> : <XCircle className="w-8 h-8 text-destructive" />}
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Eligible for {eligibleCount} out of {activeCompanies.length} companies</h2>
                <p className="text-muted-foreground">Based on your academic profile</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-card border-border"><CardContent className="p-6 text-center"><Award className="w-8 h-8 mx-auto text-primary mb-3" /><p className="text-sm text-muted-foreground">CGPA</p><p className="text-3xl font-bold text-foreground">{cgpa.toFixed(2)}</p><Progress value={cgpa * 10} className="mt-3 h-2" /></CardContent></Card>
        <Card className="bg-gradient-card border-border"><CardContent className="p-6 text-center"><AlertCircle className="w-8 h-8 mx-auto text-warning mb-3" /><p className="text-sm text-muted-foreground">Backlogs</p><p className="text-3xl font-bold text-foreground">{backlogs}</p><p className="text-xs text-muted-foreground mt-3">{backlogs === 0 ? 'No backlogs 🎉' : `${backlogs} active backlog${backlogs > 1 ? 's' : ''}`}</p></CardContent></Card>
        <Card className="bg-gradient-card border-border"><CardContent className="p-6 text-center"><BookOpen className="w-8 h-8 mx-auto text-info mb-3" /><p className="text-sm text-muted-foreground">Branch</p><p className="text-lg font-bold text-foreground truncate">{branch}</p></CardContent></Card>
      </div>

      <Card className="bg-gradient-card border-border">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" />Eligibility by Company</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {eligibilityResults.length === 0 && <p className="text-center py-8 text-muted-foreground">No companies available yet</p>}
          {eligibilityResults.map((result, index) => (
            <div key={index} className={`p-4 rounded-lg border ${result.isEligible ? 'bg-success/5 border-success/30' : 'bg-secondary/30 border-border'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {result.isEligible ? <CheckCircle className="w-5 h-5 text-success" /> : <XCircle className="w-5 h-5 text-muted-foreground" />}
                  <span className={`font-medium ${result.isEligible ? 'text-foreground' : 'text-muted-foreground'}`}>{result.name}</span>
                </div>
                <Badge variant={result.isEligible ? 'default' : 'secondary'} className={result.isEligible ? 'bg-success/20 text-success border-success/30' : ''}>{result.isEligible ? 'Eligible' : 'Not Eligible'}</Badge>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className={`flex items-center gap-1 ${result.cgpaEligible ? 'text-success' : 'text-destructive'}`}>{result.cgpaEligible ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}CGPA ≥ {result.minCGPA} (You: {cgpa.toFixed(2)})</span>
                <span className={`flex items-center gap-1 ${result.backlogsEligible ? 'text-success' : 'text-destructive'}`}>{result.backlogsEligible ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}Backlogs ≤ {result.maxBacklogs} (You: {backlogs})</span>
                <span className={`flex items-center gap-1 ${result.branchEligible ? 'text-success' : 'text-destructive'}`}>{result.branchEligible ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}Branch: {result.branchEligible ? 'Matched' : 'Not Matched'}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-gradient-card border-border">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" />Recommendations</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {cgpa < 8.0 && <li className="flex items-start gap-3 text-sm"><Award className="w-4 h-4 text-info flex-shrink-0 mt-0.5" /><span className="text-muted-foreground">Improving your CGPA to 8.0+ will make you eligible for top-tier companies.</span></li>}
            {backlogs > 0 && <li className="flex items-start gap-3 text-sm"><AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" /><span className="text-muted-foreground">Clearing your backlogs will significantly increase your eligibility.</span></li>}
            <li className="flex items-start gap-3 text-sm"><CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" /><span className="text-muted-foreground">Build projects and internship experience to stand out.</span></li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default EligibilityStatus;
