/**
 * Registration Page - Disabled
 * Students are now created by admin with bulk upload.
 * This page informs users to contact their admin.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Register: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="glass-card rounded-2xl p-8 animate-fade-in text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-warning/20 mb-4">
            <ShieldAlert className="w-8 h-8 text-warning" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Registration Disabled</h1>
          <p className="text-muted-foreground mb-6">
            Student accounts are created by the Placement Cell Admin. 
            Please contact your admin to get your login credentials.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Default password: <strong>College@123</strong><br />
            You'll be asked to change it on first login.
          </p>
          <Button asChild className="w-full bg-gradient-primary">
            <Link to="/login">Go to Login</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Register;
