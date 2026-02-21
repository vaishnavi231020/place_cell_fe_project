/**
 * Firestore Service Layer
 * 
 * Centralized CRUD operations for all Firestore collections:
 * - companies, jobPostings, applications, interviews, notifications
 */

import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  QueryConstraint
} from 'firebase/firestore';
import { db } from './firebase';

// ============ COMPANIES ============

export interface FirestoreCompany {
  id?: string;
  name: string;
  industry: string;
  location: string;
  package: string;
  minCGPA: number;
  maxBacklogs: number;
  openPositions: number;
  JobRole: string;
  allowedBranches: string[];
  description: string;
  status: 'Active' | 'Inactive';
  createdAt?: any;
}

export async function addCompany(data: Omit<FirestoreCompany, 'id' | 'createdAt'>) {
  const ref = await addDoc(collection(db, 'companies'), {
    ...data,
    createdAt: serverTimestamp()
  });
  return ref.id;
}

export async function updateCompany(id: string, data: Partial<FirestoreCompany>) {
  await updateDoc(doc(db, 'companies', id), data);
}

export async function deleteCompany(id: string) {
  await deleteDoc(doc(db, 'companies', id));
}

export function subscribeToCompanies(callback: (companies: FirestoreCompany[]) => void) {
  const q = query(collection(db, 'companies'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const companies = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreCompany));
    callback(companies);
  }, (error) => {
    console.error('Error fetching companies:', error);
    callback([]);
  });
}

// ============ JOB POSTINGS ============

export interface FirestoreJobPosting {
  id?: string;
  title: string;
  companyName: string;
  companyId?: string;
  location: string;
  package: string;
  eligibleBranches: string[];
  minCGPA: number;
  maxBacklogs: number;
  deadline: string;
  description: string;
  status: 'Active' | 'Closed' | 'Draft';
  createdAt?: any;
}

export async function addJobPosting(data: Omit<FirestoreJobPosting, 'id' | 'createdAt'>) {
  const ref = await addDoc(collection(db, 'jobPostings'), {
    ...data,
    createdAt: serverTimestamp()
  });
  return ref.id;
}

export async function updateJobPosting(id: string, data: Partial<FirestoreJobPosting>) {
  await updateDoc(doc(db, 'jobPostings', id), data);
}

export async function deleteJobPosting(id: string) {
  await deleteDoc(doc(db, 'jobPostings', id));
}

export function subscribeToJobPostings(callback: (jobs: FirestoreJobPosting[]) => void) {
  const q = query(collection(db, 'jobPostings'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const jobs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreJobPosting));
    callback(jobs);
  }, (error) => {
    console.error('Error fetching job postings:', error);
    callback([]);
  });
}

// ============ APPLICATIONS ============

export interface FirestoreApplication {
  id?: string;
  userId: string;
  userEmail: string;
  userName: string;
  companyId: string;
  companyName: string;
  jobPostingId?: string;
  position: string;
  status: 'Applied' | 'Shortlisted' | 'Rejected' | 'Selected';
  appliedAt?: any;
}

export async function addApplication(data: Omit<FirestoreApplication, 'id' | 'appliedAt'>) {
  // Check if already applied
  const q = query(
    collection(db, 'applications'),
    where('userId', '==', data.userId),
    where('companyId', '==', data.companyId)
  );
  const existing = await getDocs(q);
  if (!existing.empty) throw new Error('You have already applied to this company');

  const ref = await addDoc(collection(db, 'applications'), {
    ...data,
    appliedAt: serverTimestamp()
  });
  return ref.id;
}

export async function updateApplicationStatus(id: string, status: FirestoreApplication['status']) {
  await updateDoc(doc(db, 'applications', id), { status });
}

export function subscribeToAllApplications(callback: (apps: FirestoreApplication[]) => void) {
  const q = query(collection(db, 'applications'), orderBy('appliedAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const apps = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreApplication));
    callback(apps);
  }, (error) => {
    console.error('Error fetching applications:', error);
    callback([]);
  });
}

export function subscribeToUserApplications(userId: string, callback: (apps: FirestoreApplication[]) => void) {
  // Using only where() without orderBy() to avoid requiring a composite index
  const q = query(
    collection(db, 'applications'),
    where('userId', '==', userId)
  );
  return onSnapshot(q, (snapshot) => {
    const apps = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() } as FirestoreApplication))
      .sort((a, b) => {
        const dateA = a.appliedAt?.toDate?.() || new Date(a.appliedAt || 0);
        const dateB = b.appliedAt?.toDate?.() || new Date(b.appliedAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
    callback(apps);
  }, (error) => {
    console.error('Error fetching user applications:', error);
    callback([]);
  });
}

// ============ INTERVIEWS ============

export interface FirestoreInterview {
  id?: string;
  companyName: string;
  companyId?: string;
  date: string;
  time: string;
  mode: 'Online' | 'Offline';
  location: string;
  round: string;
  studentIds?: string[];
  targetBranch?: string;
  targetYear?: string;
  status: 'Upcoming' | 'Ongoing' | 'Completed';
  createdAt?: any;
}

export async function addInterview(data: Omit<FirestoreInterview, 'id' | 'createdAt'>) {
  const ref = await addDoc(collection(db, 'interviews'), {
    ...data,
    createdAt: serverTimestamp()
  });
  return ref.id;
}

export async function updateInterview(id: string, data: Partial<FirestoreInterview>) {
  await updateDoc(doc(db, 'interviews', id), data);
}

export async function deleteInterview(id: string) {
  await deleteDoc(doc(db, 'interviews', id));
}

export function subscribeToInterviews(callback: (interviews: FirestoreInterview[]) => void) {
  const q = query(collection(db, 'interviews'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const interviews = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreInterview));
    callback(interviews);
  }, (error) => {
    console.error('Error fetching interviews:', error);
    callback([]);
  });
}

// ============ NOTIFICATIONS ============

export interface FirestoreNotification {
  id?: string;
  title: string;
  message: string;
  type: string;
  targetBranch: string; // 'all' or specific branch
  targetYear: string;   // 'all' or specific year
  recipients: string;   // display text
  sentBy?: string;
  createdAt?: any;
  isRead?: boolean;
}

export async function addNotification(data: Omit<FirestoreNotification, 'id' | 'createdAt'>) {
  const ref = await addDoc(collection(db, 'notifications'), {
    ...data,
    createdAt: serverTimestamp()
  });
  return ref.id;
}

export function subscribeToNotifications(callback: (notifications: FirestoreNotification[]) => void) {
  const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreNotification));
    callback(notifications);
  }, (error) => {
    console.error('Error fetching notifications:', error);
    callback([]);
  });
}

// ============ USERS / STUDENTS ============

export async function fetchAllStudents() {
  const q = query(collection(db, 'users'), where('role', '==', 'STUDENT'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ uid: d.id, ...d.data() }));
}

export function subscribeToStudents(callback: (students: any[]) => void) {
  const q = query(collection(db, 'users'), where('role', '==', 'STUDENT'));
  return onSnapshot(q, (snapshot) => {
    const students = snapshot.docs.map(d => ({ uid: d.id, ...d.data() }));
    callback(students);
  }, (error) => {
    console.error('Error fetching students:', error);
    callback([]);
  });
}

// ============ DASHBOARD STATS ============

export async function fetchAdminStats() {
  try {
    const [studentsSnap, companiesSnap, applicationsSnap, interviewsSnap] = await Promise.all([
      getDocs(query(collection(db, 'users'), where('role', '==', 'STUDENT'))),
      getDocs(collection(db, 'companies')),
      getDocs(collection(db, 'applications')),
      getDocs(collection(db, 'interviews'))
    ]);

    const applications = applicationsSnap.docs.map(d => d.data());
    const students = studentsSnap.docs.map(d => d.data());
    const interviews = interviewsSnap.docs.map(d => d.data());

    return {
      totalStudents: studentsSnap.size,
      totalCompanies: companiesSnap.size,
      totalApplications: applicationsSnap.size,
      activeJobPostings: 0, // Will be computed separately
      scheduledInterviews: interviews.filter((i: any) => i.status === 'Upcoming').length,
      selectedStudents: applications.filter((a: any) => a.status === 'Selected').length,
      pendingResumes: students.filter((s: any) => !s.resumeVerified).length,
      placementRate: studentsSnap.size > 0
        ? Math.round((students.filter((s: any) => s.placed).length / studentsSnap.size) * 100)
        : 0
    };
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return null;
  }
}
