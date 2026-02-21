/**
 * Resume Status Page
 * 
 * NOTE: Resume upload feature is disabled (requires Firebase paid plan)
 * This page shows information about the feature status
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  Info
} from 'lucide-react';

const ResumeStatus: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Status Card */}
      <Card className="bg-gradient-card border-warning/30">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-10 h-10 text-warning" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Feature Not Available</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Resume upload requires Firebase Storage which needs a paid plan. 
            This feature will be available once the plan is upgraded.
          </p>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            What you can do instead
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary/50">
            <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Share Resume Link</p>
              <p className="text-sm text-muted-foreground">
                Upload your resume to Google Drive or Dropbox and share the link during applications.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resume Tips */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Resume Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {[
              'Keep your resume to 1-2 pages maximum',
              'Include your contact information and LinkedIn profile',
              'List your skills relevant to the job you\'re applying for',
              'Highlight your projects with technologies used',
              'Proofread for spelling and grammatical errors',
              'Use a clean, professional format'
            ].map((tip, index) => (
              <li key={index} className="flex items-start gap-3 text-sm">
                <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{tip}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResumeStatus;
