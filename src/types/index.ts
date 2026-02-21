/**
 * Student Placement Portal - Type Definitions
 * These types mirror the Firestore database schema
 * for type-safe data handling throughout the application.
 */

// User roles for authorization
export type UserRole = 'STUDENT' | 'ADMIN';

// Application status types
export type ApplicationStatus = 'Applied' | 'Shortlisted' | 'Rejected' | 'Selected';

// Interview mode types
export type InterviewMode = 'Online' | 'Offline';

// Notification types
export type NotificationType = 'Interview' | 'Resume' | 'Placement' | 'Document';

// User document structure (Firestore: users collection)
export interface User {
  uid: string;
  name: string;
  email: string;
  branch?: string;
  cgpa?: number;
  backlogs?: number;
  year?: number;
  resumeUrl?: string;
  role: UserRole;
  createdAt: Date;
  resumeVerified?: boolean;
  firstLogin?: boolean;
  placed?: boolean;
}

// Company eligibility criteria
export interface EligibilityCriteria {
  minCGPA: number;
  maxBacklogs: number;
  allowedBranches: string[];
}

// Company document structure (Firestore: companies collection)
export interface Company {
  id: string;
  companyName: string;
  description: string;
  eligibility: EligibilityCriteria;
  package: string;
  location: string;
  createdAt: Date;
  logo?: string;
  industry?: string;
  openPositions?: number;
  deadline?: Date;
}

// Application document structure (Firestore: applications collection)
export interface Application {
  id: string;
  userId: string;
  companyId: string;
  status: ApplicationStatus;
  appliedAt: Date;
  // Denormalized fields for easy display
  companyName?: string;
  userName?: string;
}

// Interview document structure (Firestore: interviews collection)
export interface Interview {
  id: string;
  userId: string;
  companyId: string;
  mode: InterviewMode;
  locationOrLink: string;
  round: string;
  interviewDate: Date;
  // Denormalized fields
  companyName?: string;
  userName?: string;
}

// Notification document structure (Firestore: notifications collection)
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  createdAt: Date;
  isRead: boolean;
}

// Auth context state
export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// Dashboard statistics
export interface DashboardStats {
  totalCompanies: number;
  appliedJobs: number;
  scheduledInterviews: number;
  unreadNotifications: number;
}

// Admin dashboard statistics
export interface AdminDashboardStats {
  totalStudents: number;
  totalCompanies: number;
  totalApplications: number;
  scheduledInterviews: number;
  selectedStudents: number;
  pendingResumeVerification: number;
}

// Form data for registration (no resume - requires paid Firebase plan)
export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  branch: string;
  cgpa: number;
  backlogs: number;
  year: number;
}

// Branch options for dropdown
export const BRANCH_OPTIONS = [
  'Computer Science',
  'Information Technology',
  'Electronics & Communication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Biotechnology',
] as const;

// Year options
export const YEAR_OPTIONS = [1, 2, 3, 4] as const;
