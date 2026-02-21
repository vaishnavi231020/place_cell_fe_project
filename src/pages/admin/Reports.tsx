/**
 * Admin Reports Page - Connected to Firestore for real analytics
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Download, TrendingUp, Users, Building2, CheckCircle, PieChart, FileText, Loader2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, Legend
} from 'recharts';
import { useCompanies, useAllApplications, useStudents, useInterviews } from '@/hooks/useFirestore';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#6b7280'];

const AdminReports: React.FC = () => {
  const { companies, loading: loadingCompanies } = useCompanies();
  const { applications, loading: loadingApps } = useAllApplications();
  const { students, loading: loadingStudents } = useStudents();
  const { interviews } = useInterviews();

  const loading = loadingCompanies || loadingApps || loadingStudents;

  // Compute stats from real data
  const totalStudents = students.length;
  const placedStudents = students.filter((s: any) => s.placed).length;
  const placementRate = totalStudents > 0 ? Math.round((placedStudents / totalStudents) * 100) : 0;
  const selectedApps = applications.filter(a => a.status === 'Selected').length;

  // Branch-wise placement data
  const branchData = (() => {
    const branches: Record<string, { total: number; placed: number }> = {};
    students.forEach((s: any) => {
      const branch = s.branch || 'Unknown';
      if (!branches[branch]) branches[branch] = { total: 0, placed: 0 };
      branches[branch].total++;
      if (s.placed) branches[branch].placed++;
    });
    return Object.entries(branches).map(([branch, data]) => ({
      branch: branch.length > 10 ? branch.substring(0, 10) + '..' : branch,
      placed: data.placed,
      total: data.total
    }));
  })();

  // Company-wise placements (selections)
  const companyWiseData = (() => {
    const compCounts: Record<string, number> = {};
    applications.filter(a => a.status === 'Selected').forEach(a => {
      compCounts[a.companyName] = (compCounts[a.companyName] || 0) + 1;
    });
    return Object.entries(compCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));
  })();

  // Application status distribution
  const statusData = [
    { name: 'Applied', value: applications.filter(a => a.status === 'Applied').length, color: '#3b82f6' },
    { name: 'Shortlisted', value: applications.filter(a => a.status === 'Shortlisted').length, color: '#f59e0b' },
    { name: 'Selected', value: applications.filter(a => a.status === 'Selected').length, color: '#22c55e' },
    { name: 'Rejected', value: applications.filter(a => a.status === 'Rejected').length, color: '#ef4444' },
  ].filter(d => d.value > 0);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Students', value: totalStudents, icon: Users },
          { label: 'Placed', value: placedStudents, icon: CheckCircle },
          { label: 'Placement Rate', value: `${placementRate}%`, icon: TrendingUp },
          { label: 'Applications', value: applications.length, icon: FileText },
          { label: 'Selections', value: selectedApps, icon: CheckCircle },
          { label: 'Companies', value: companies.length, icon: Building2 },
        ].map((stat, i) => (
          <Card key={i}><CardContent className="p-4 text-center"><stat.icon className="w-6 h-6 mx-auto mb-2 text-primary" /><p className="text-xl font-bold">{stat.value}</p><p className="text-xs text-muted-foreground">{stat.label}</p></CardContent></Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-card border-border">
          <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5" />Branch-wise Students</CardTitle></CardHeader>
          <CardContent>
            {branchData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={branchData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="branch" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="placed" name="Placed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="total" name="Total" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center py-12 text-muted-foreground">No student data yet</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border">
          <CardHeader><CardTitle className="flex items-center gap-2"><PieChart className="w-5 h-5" />Application Status</CardTitle></CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPie>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Legend />
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <p className="text-center py-12 text-muted-foreground">No application data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {companyWiseData.length > 0 && (
        <Card className="bg-gradient-card border-border">
          <CardHeader><CardTitle>Top Recruiters</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {companyWiseData.map((recruiter, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    <span className="font-medium">{recruiter.name}</span>
                  </div>
                  <span className="text-muted-foreground">{recruiter.value} selections</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminReports;
