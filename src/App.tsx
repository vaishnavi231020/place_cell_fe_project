/**
 * Main Application Component
 * 
 * Routing architecture:
 * - /login → Unified login (student/admin toggle)
 * - /change-password → First-time password change (protected)
 * - /admin/* → Admin panel (protected, admin only)
 * - /dashboard/* → Student panel (protected)
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Auth
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/layout/ProtectedRoute";

// Layouts
import AdminLayout from "@/components/layout/AdminLayout";
import DashboardLayout from "@/components/layout/DashboardLayout";

// Auth Pages
import Login from "@/pages/auth/Login";
import ChangePassword from "@/pages/auth/ChangePassword";
import ForgotPassword from "@/pages/auth/ForgotPassword";

// Admin Pages
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminCompanies from "@/pages/admin/Companies";
import AdminStudents from "@/pages/admin/Students";
import AdminApplications from "@/pages/admin/Applications";
import AdminInterviews from "@/pages/admin/Interviews";
import AdminNotifications from "@/pages/admin/Notifications";
import AdminReports from "@/pages/admin/Reports";
import AdminJobPostings from "@/pages/admin/JobPostings";

// Student Pages
import StudentDashboard from "@/pages/student/Dashboard";
import StudentProfile from "@/pages/student/Profile";
import StudentCompanies from "@/pages/student/Companies";
import StudentApplications from "@/pages/student/Applications";
import StudentInterviews from "@/pages/student/Interviews";
import StudentNotifications from "@/pages/student/Notifications";
import StudentResumeStatus from "@/pages/student/ResumeStatus";
import StudentEligibility from "@/pages/student/EligibilityStatus";
import StudentPracticeInterview from "@/pages/student/PracticeInterview";
import StudentInterviewHistory from "@/pages/student/InterviewHistory";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Change Password (must be logged in) */}
            <Route path="/change-password" element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            } />

            {/* Admin Routes (protected, admin only) */}
            <Route path="/admin" element={
              <ProtectedRoute adminOnly>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="companies" element={<AdminCompanies />} />
              <Route path="students" element={<AdminStudents />} />
              <Route path="applications" element={<AdminApplications />} />
              <Route path="interviews" element={<AdminInterviews />} />
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="job-postings" element={<AdminJobPostings />} />
              <Route path="reports" element={<AdminReports />} />
            </Route>

            {/* Student Routes (protected) */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<StudentDashboard />} />
              <Route path="profile" element={<StudentProfile />} />
              <Route path="companies" element={<StudentCompanies />} />
              <Route path="applications" element={<StudentApplications />} />
              <Route path="interviews" element={<StudentInterviews />} />
              <Route path="notifications" element={<StudentNotifications />} />
              <Route path="practice-interview" element={<StudentPracticeInterview />} />
              <Route path="interview-history" element={<StudentInterviewHistory />} />
              <Route path="resume" element={<StudentResumeStatus />} />
              <Route path="eligibility" element={<StudentEligibility />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
