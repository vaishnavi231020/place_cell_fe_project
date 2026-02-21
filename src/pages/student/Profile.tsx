/**
 * Student Profile Page
 * 
 * FEATURES:
 * - Display user information
 * - Edit profile form
 * - Resume upload/update
 * - CGPA and academic details
 */

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { BRANCH_OPTIONS, YEAR_OPTIONS } from '@/types';
import { 
  User, 
  Mail, 
  BookOpen, 
  Award, 
  AlertCircle, 
  Calendar, 
  FileText,
  Edit,
  Save,
  X,
  Upload
} from 'lucide-react';

const Profile: React.FC = () => {
  const { userData, updateUserData } = useAuth();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: userData?.name || '',
    branch: userData?.branch || '',
    cgpa: userData?.cgpa || 0,
    backlogs: userData?.backlogs || 0,
    year: userData?.year || 4
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateUserData(formData);
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully'
      });
      setEditing(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: userData?.name || '',
      branch: userData?.branch || '',
      cgpa: userData?.cgpa || 0,
      backlogs: userData?.backlogs || 0,
      year: userData?.year || 4
    });
    setEditing(false);
  };

  const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) => (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30">
      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium text-foreground">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Profile Header */}
      <Card className="bg-gradient-card border-border">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-12 h-12 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground">{userData?.name}</h2>
              <p className="text-muted-foreground">{userData?.email}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm">
                  {userData?.branch}
                </span>
                <span className="px-3 py-1 rounded-full bg-info/20 text-info text-sm">
                  Year {userData?.year}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  userData?.resumeVerified 
                    ? 'bg-success/20 text-success' 
                    : 'bg-warning/20 text-warning'
                }`}>
                  {userData?.resumeVerified ? 'Resume Verified' : 'Resume Pending'}
                </span>
              </div>
            </div>
            <Button
              variant={editing ? 'outline' : 'default'}
              onClick={() => editing ? handleCancel() : setEditing(true)}
            >
              {editing ? (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <>
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email (Cannot be changed)</Label>
                  <Input
                    value={userData?.email || ''}
                    disabled
                    className="bg-secondary/30 opacity-50"
                  />
                </div>
              </>
            ) : (
              <>
                <InfoRow icon={User} label="Full Name" value={userData?.name || '-'} />
                <InfoRow icon={Mail} label="Email" value={userData?.email || '-'} />
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Academic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <>
                <div className="space-y-2">
                  <Label>Branch</Label>
                  <Select
                    value={formData.branch}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, branch: value }))}
                  >
                    <SelectTrigger className="bg-secondary/50">
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRANCH_OPTIONS.map((branch) => (
                        <SelectItem key={branch} value={branch}>
                          {branch}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Select
                    value={formData.year.toString()}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, year: parseInt(value) }))}
                  >
                    <SelectTrigger className="bg-secondary/50">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {YEAR_OPTIONS.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          Year {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>CGPA</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={formData.cgpa}
                      onChange={(e) => setFormData(prev => ({ ...prev, cgpa: parseFloat(e.target.value) || 0 }))}
                      className="bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Backlogs</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.backlogs}
                      onChange={(e) => setFormData(prev => ({ ...prev, backlogs: parseInt(e.target.value) || 0 }))}
                      className="bg-secondary/50"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <InfoRow icon={BookOpen} label="Branch" value={userData?.branch || '-'} />
                <InfoRow icon={Calendar} label="Year" value={`Year ${userData?.year || '-'}`} />
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow icon={Award} label="CGPA" value={userData?.cgpa?.toFixed(2) || '-'} />
                  <InfoRow icon={AlertCircle} label="Backlogs" value={userData?.backlogs || 0} />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resume Section */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Resume</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {userData?.resumeUrl ? 'Resume Uploaded' : 'No Resume Uploaded'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {userData?.resumeVerified 
                    ? 'Verified by TPO' 
                    : userData?.resumeUrl 
                    ? 'Pending verification' 
                    : 'Upload your resume to apply for jobs'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {userData?.resumeUrl && (
                <Button variant="outline" asChild>
                  <a href={userData.resumeUrl} target="_blank" rel="noopener noreferrer">
                    View
                  </a>
                </Button>
              )}
              <Button variant="secondary">
                <Upload className="w-4 h-4 mr-2" />
                {userData?.resumeUrl ? 'Update' : 'Upload'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      {editing && (
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={loading}
            className="bg-gradient-primary"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default Profile;
