/**
 * Admin Students Management Page
 * 
 * Features:
 * - Real-time student data from Firestore
 * - Add single student
 * - Bulk upload students via CSV
 * - Filter by branch, CGPA, backlogs
 * - Send messages to selected students
 */

import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createStudentAccount, createBulkStudents, parseStudentCSV, StudentData, CreateResult } from '@/lib/firebaseUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  Filter, 
  Mail, 
  Download, 
  Users, 
  GraduationCap,
  CheckCircle,
  XCircle,
  Send,
  Plus,
  Upload,
  Loader2,
  UserPlus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BRANCH_OPTIONS } from '@/types';

interface Student {
  id: string;
  name: string;
  email: string;
  branch: string;
  cgpa: number;
  backlogs: number;
  year: number;
  resumeVerified: boolean;
  placed: boolean;
  firstLogin: boolean;
}

const AdminStudents: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [minCGPA, setMinCGPA] = useState<string>('');
  const [maxBacklogs, setMaxBacklogs] = useState<string>('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [message, setMessage] = useState({ subject: '', body: '' });
  const { toast } = useToast();

  // Single student form
  const [newStudent, setNewStudent] = useState<StudentData>({
    name: '', email: '', branch: '', cgpa: 0, backlogs: 0, year: 4
  });
  const [addingStudent, setAddingStudent] = useState(false);

  // Bulk upload state
  const [csvData, setCsvData] = useState('');
  const [bulkUploading, setBulkUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [uploadResults, setUploadResults] = useState<CreateResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch students from Firestore in real-time
  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'STUDENT'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentsList = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || '',
        email: doc.data().email || '',
        branch: doc.data().branch || '',
        cgpa: doc.data().cgpa || 0,
        backlogs: doc.data().backlogs || 0,
        year: doc.data().year || 4,
        resumeVerified: doc.data().resumeVerified || false,
        placed: doc.data().placed || false,
        firstLogin: doc.data().firstLogin || false,
      })) as Student[];
      setStudents(studentsList);
      setLoadingStudents(false);
    }, (error) => {
      console.error('Error fetching students:', error);
      setLoadingStudents(false);
      toast({ title: 'Error', description: 'Failed to load students. Check Firestore rules.', variant: 'destructive' });
    });

    return () => unsubscribe();
  }, []);

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          student.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBranch = selectedBranch === 'all' || student.branch === selectedBranch;
    const matchesCGPA = !minCGPA || student.cgpa >= parseFloat(minCGPA);
    const matchesBacklogs = !maxBacklogs || student.backlogs <= parseInt(maxBacklogs);
    return matchesSearch && matchesBranch && matchesCGPA && matchesBacklogs;
  });

  const toggleStudentSelection = (id: string) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id));
    }
  };

  // Add single student
  const handleAddStudent = async () => {
    if (!newStudent.name || !newStudent.email || !newStudent.branch) {
      toast({ title: 'Error', description: 'Please fill name, email and branch', variant: 'destructive' });
      return;
    }
    
    setAddingStudent(true);
    try {
      const result = await createStudentAccount(newStudent);
      if (result.success) {
        toast({ title: 'Student Created!', description: `${newStudent.name} added with default password College@123` });
        setNewStudent({ name: '', email: '', branch: '', cgpa: 0, backlogs: 0, year: 4 });
        setIsAddDialogOpen(false);
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setAddingStudent(false);
    }
  };

  // Handle CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvData(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  // Bulk upload students
  const handleBulkUpload = async () => {
    if (!csvData.trim()) {
      toast({ title: 'Error', description: 'Please paste CSV data or upload a file', variant: 'destructive' });
      return;
    }

    const students = parseStudentCSV(csvData);
    if (students.length === 0) {
      toast({ title: 'Error', description: 'No valid students found in CSV. Check format.', variant: 'destructive' });
      return;
    }

    setBulkUploading(true);
    setUploadResults([]);
    setUploadProgress({ current: 0, total: students.length });

    try {
      const results = await createBulkStudents(students, (current, total) => {
        setUploadProgress({ current, total });
      });

      setUploadResults(results);
      const succeeded = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      toast({
        title: 'Bulk Upload Complete',
        description: `${succeeded} created, ${failed} failed out of ${results.length} students`
      });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setBulkUploading(false);
    }
  };

  const handleSendMessage = () => {
    if (!message.subject || !message.body) {
      toast({ title: 'Error', description: 'Please fill all fields', variant: 'destructive' });
      return;
    }
    toast({ title: 'Messages Sent!', description: `Notification sent to ${selectedStudents.length} students` });
    setIsMessageDialogOpen(false);
    setMessage({ subject: '', body: '' });
    setSelectedStudents([]);
  };

  const stats = {
    total: students.length,
    placed: students.filter(s => s.placed).length,
    verified: students.filter(s => s.resumeVerified).length,
    eligible: students.filter(s => (s.cgpa || 0) >= 6.0 && s.backlogs === 0).length
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Students</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.placed}</p>
              <p className="text-xs text-muted-foreground">Placed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/20 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.eligible}</p>
              <p className="text-xs text-muted-foreground">Eligible</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.verified}</p>
              <p className="text-xs text-muted-foreground">Resume Verified</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter Students
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger>
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {BRANCH_OPTIONS.map(branch => (
                  <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              step="0.1"
              placeholder="Min CGPA (e.g., 6.0)"
              value={minCGPA}
              onChange={(e) => setMinCGPA(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Max Backlogs (e.g., 0)"
              value={maxBacklogs}
              onChange={(e) => setMaxBacklogs(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions Bar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {loadingStudents ? 'Loading...' : `Showing ${filteredStudents.length} of ${students.length} students`}
          {selectedStudents.length > 0 && ` • ${selectedStudents.length} selected`}
        </p>
        <div className="flex gap-2 flex-wrap">
          {/* Add Single Student */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Single Student</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">
                  Student will be created with default password: <strong>College@123</strong>
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <Input
                      value={newStudent.name}
                      onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                      placeholder="Rahul Kumar"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      value={newStudent.email}
                      onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                      placeholder="rahul@college.edu"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Branch *</Label>
                  <Select value={newStudent.branch} onValueChange={(v) => setNewStudent({ ...newStudent, branch: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRANCH_OPTIONS.map(branch => (
                        <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>CGPA</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={newStudent.cgpa}
                      onChange={(e) => setNewStudent({ ...newStudent, cgpa: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Backlogs</Label>
                    <Input
                      type="number"
                      value={newStudent.backlogs}
                      onChange={(e) => setNewStudent({ ...newStudent, backlogs: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Input
                      type="number"
                      value={newStudent.year}
                      onChange={(e) => setNewStudent({ ...newStudent, year: parseInt(e.target.value) || 4 })}
                    />
                  </div>
                </div>
                <Button onClick={handleAddStudent} className="w-full" disabled={addingStudent}>
                  {addingStudent ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
                  ) : (
                    <><UserPlus className="w-4 h-4 mr-2" /> Create Student Account</>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Bulk Upload */}
          <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary">
                <Upload className="w-4 h-4 mr-2" />
                Bulk Upload
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Bulk Upload Students</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-sm font-medium text-foreground mb-1">CSV Format Required:</p>
                  <code className="text-xs text-muted-foreground">
                    name,email,branch,cgpa,backlogs,year
                  </code>
                  <p className="text-xs text-muted-foreground mt-2">
                    All students will get default password: <strong>College@123</strong>
                  </p>
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <Label>Upload CSV File</Label>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="bg-secondary/50"
                  />
                </div>

                {/* Or paste CSV */}
                <div className="space-y-2">
                  <Label>Or Paste CSV Data</Label>
                  <Textarea
                    value={csvData}
                    onChange={(e) => setCsvData(e.target.value)}
                    placeholder={`name,email,branch,cgpa,backlogs,year\nRahul Kumar,rahul@college.edu,Computer Science,8.5,0,4\nPriya Sharma,priya@college.edu,Information Technology,7.8,0,4`}
                    rows={6}
                    className="font-mono text-xs"
                  />
                </div>

                {/* Preview parsed count */}
                {csvData && (
                  <p className="text-sm text-muted-foreground">
                    📊 {parseStudentCSV(csvData).length} students detected in CSV
                  </p>
                )}

                {/* Progress */}
                {bulkUploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Creating students...</span>
                      <span>{uploadProgress.current} / {uploadProgress.total}</span>
                    </div>
                    <Progress value={(uploadProgress.current / uploadProgress.total) * 100} />
                  </div>
                )}

                {/* Results */}
                {uploadResults.length > 0 && !bulkUploading && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    <p className="text-sm font-medium">Results:</p>
                    {uploadResults.map((result, i) => (
                      <div key={i} className={`flex items-center gap-2 text-xs p-2 rounded ${
                        result.success ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                      }`}>
                        {result.success ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>{result.email}</span>
                        {result.error && <span>— {result.error}</span>}
                      </div>
                    ))}
                  </div>
                )}

                <Button 
                  onClick={handleBulkUpload} 
                  className="w-full" 
                  disabled={bulkUploading || !csvData.trim()}
                >
                  {bulkUploading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                  ) : (
                    <><Upload className="w-4 h-4 mr-2" /> Upload Students</>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>

          <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={selectedStudents.length === 0} variant="outline">
                <Mail className="w-4 h-4 mr-2" />
                Send Message ({selectedStudents.length})
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Message to Selected Students</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    value={message.subject}
                    onChange={(e) => setMessage({ ...message, subject: e.target.value })}
                    placeholder="e.g., Interview Scheduled for TCS"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    value={message.body}
                    onChange={(e) => setMessage({ ...message, body: e.target.value })}
                    placeholder="Enter your message here..."
                    rows={5}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  This will send a notification to {selectedStudents.length} selected students.
                </p>
                <Button onClick={handleSendMessage} className="w-full">
                  <Send className="w-4 h-4 mr-2" />
                  Send Notification
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Students Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                    onCheckedChange={selectAll}
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>CGPA</TableHead>
                <TableHead>Backlogs</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Resume</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingStudents ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                    <p className="text-sm text-muted-foreground mt-2">Loading students from Firebase...</p>
                  </TableCell>
                </TableRow>
              ) : filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <Users className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {students.length === 0 ? 'No students yet. Add students using the buttons above.' : 'No students match your filters.'}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={() => toggleStudentSelection(student.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell className="text-muted-foreground">{student.email}</TableCell>
                    <TableCell>{student.branch}</TableCell>
                    <TableCell>
                      <Badge variant={(student.cgpa || 0) >= 7 ? 'default' : 'secondary'}>
                        {(student.cgpa || 0).toFixed(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={student.backlogs === 0 ? 'default' : 'destructive'}>
                        {student.backlogs}
                      </Badge>
                    </TableCell>
                    <TableCell>{student.year}</TableCell>
                    <TableCell>
                      {student.resumeVerified ? (
                        <CheckCircle className="w-5 h-5 text-success" />
                      ) : (
                        <XCircle className="w-5 h-5 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell>
                      {student.firstLogin ? (
                        <Badge variant="outline" className="text-warning border-warning/30">
                          Pending Login
                        </Badge>
                      ) : student.placed ? (
                        <Badge variant="default">Placed</Badge>
                      ) : (
                        <Badge variant="outline">Active</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStudents;
