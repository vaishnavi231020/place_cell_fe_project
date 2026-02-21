/**
 * Firebase Utility Functions
 * 
 * Handles bulk student creation using a secondary Firebase app instance.
 * This allows the admin to create student accounts without being signed out.
 * 
 * Flow:
 * 1. Secondary Firebase app creates the auth user
 * 2. Firestore doc is created with student data + firstLogin: true
 * 3. Secondary auth is signed out (admin stays logged in on primary)
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db, firebaseConfig } from './firebase';

// Secondary app for creating users without affecting admin session
let secondaryApp: FirebaseApp | null = null;

function getSecondaryApp(): FirebaseApp {
  if (!secondaryApp) {
    secondaryApp = initializeApp(firebaseConfig, 'SecondaryApp');
  }
  return secondaryApp;
}

export interface StudentData {
  name: string;
  email: string;
  branch: string;
  cgpa: number;
  backlogs: number;
  year: number;
}

export interface CreateResult {
  success: boolean;
  email: string;
  uid?: string;
  error?: string;
}

/**
 * Create a single student account with default password "College@123"
 * Uses secondary Firebase app to avoid signing out the admin
 */
export async function createStudentAccount(data: StudentData): Promise<CreateResult> {
  const app = getSecondaryApp();
  const secondaryAuth = getAuth(app);

  try {
    const result = await createUserWithEmailAndPassword(secondaryAuth, data.email, 'College@123');
    const uid = result.user.uid;

    // Create Firestore user document
    await setDoc(doc(db, 'users', uid), {
      name: data.name,
      email: data.email,
      branch: data.branch,
      cgpa: data.cgpa,
      backlogs: data.backlogs,
      year: data.year,
      role: 'STUDENT',
      firstLogin: true,
      placed: false,
      resumeVerified: false,
      createdAt: new Date()
    });

    // Sign out of secondary auth (doesn't affect admin on primary)
    await signOut(secondaryAuth);
    return { success: true, email: data.email, uid };
  } catch (error: any) {
    try { await signOut(secondaryAuth); } catch {}
    
    let errorMsg = error.message;
    if (error.code === 'auth/email-already-in-use') {
      errorMsg = 'Email already registered';
    } else if (error.code === 'auth/invalid-email') {
      errorMsg = 'Invalid email format';
    }
    
    return { success: false, email: data.email, error: errorMsg };
  }
}

/**
 * Create multiple student accounts sequentially
 * Returns results for each student (success/failure)
 */
export async function createBulkStudents(
  students: StudentData[],
  onProgress?: (current: number, total: number) => void
): Promise<CreateResult[]> {
  const results: CreateResult[] = [];
  
  for (let i = 0; i < students.length; i++) {
    onProgress?.(i + 1, students.length);
    const result = await createStudentAccount(students[i]);
    results.push(result);
  }
  
  return results;
}

/**
 * Parse CSV text into StudentData array
 * Expected CSV format: name,email,branch,cgpa,backlogs,year
 */
export function parseStudentCSV(csvText: string): StudentData[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const students: StudentData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split(',').map(v => v.trim());
    if (values.length < headers.length) continue;

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });

    students.push({
      name: row.name || '',
      email: row.email || '',
      branch: row.branch || '',
      cgpa: parseFloat(row.cgpa) || 0,
      backlogs: parseInt(row.backlogs) || 0,
      year: parseInt(row.year) || 4
    });
  }

  return students.filter(s => s.name && s.email);
}
