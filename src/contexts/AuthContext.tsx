/**
 * Authentication Context Provider
 * 
 * Manages global auth state with Firebase Authentication.
 * Supports admin and student login roles.
 * 
 * Key features:
 * - Role-based login (admin/student)
 * - Auto-creates admin profile on first admin login
 * - Students must be pre-created by admin
 * - Password change support for first-time students
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updatePassword as firebaseUpdatePassword,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User } from '@/types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  login: (email: string, password: string, loginRole: 'admin' | 'student') => Promise<User>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserData: (data: Partial<User>) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user data from Firestore
  const fetchUserData = async (uid: string): Promise<User | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = { uid, ...userDoc.data() } as User;
        setUserData(data);
        return data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserData(user.uid);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  /**
   * Login with role validation
   * - Admin: auto-creates profile on first login, validates ADMIN role
   * - Student: must have pre-existing account created by admin
   */
  const login = async (email: string, password: string, loginRole: 'admin' | 'student'): Promise<User> => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const uid = result.user.uid;
      const userDoc = await getDoc(doc(db, 'users', uid));

      if (loginRole === 'admin') {
        if (!userDoc.exists()) {
          // First-time admin setup - auto-create admin profile
          const adminData: Omit<User, 'uid'> = {
            name: 'Admin',
            email,
            role: 'ADMIN',
            firstLogin: false,
            createdAt: new Date()
          };
          await setDoc(doc(db, 'users', uid), adminData);
          const fullData = { uid, ...adminData } as User;
          setUserData(fullData);
          return fullData;
        }

        const data = { uid, ...userDoc.data() } as User;
        if (data.role !== 'ADMIN') {
          await signOut(auth);
          throw new Error('Access denied. This account is not an admin.');
        }
        setUserData(data);
        return data;
      }

      // Student login
      if (!userDoc.exists()) {
        await signOut(auth);
        throw new Error('Student account not found. Please contact your admin.');
      }

      const data = { uid, ...userDoc.data() } as User;
      if (data.role === 'ADMIN') {
        await signOut(auth);
        throw new Error('This is an admin account. Please select Admin to login.');
      }

      setUserData(data);
      return data;
    } catch (error: any) {
      if (error.message?.includes('Access denied') || 
          error.message?.includes('not found') || 
          error.message?.includes('admin account')) {
        throw error;
      }
      throw new Error(getFriendlyErrorMessage(error));
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserData(null);
    } catch (error: any) {
      throw new Error('Failed to logout');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(getFriendlyErrorMessage(error));
    }
  };

  const updateUserData = async (data: Partial<User>) => {
    if (!currentUser) throw new Error('No user logged in');
    try {
      await setDoc(doc(db, 'users', currentUser.uid), data, { merge: true });
      setUserData(prev => prev ? { ...prev, ...data } : null);
    } catch (error: any) {
      throw new Error('Failed to update profile');
    }
  };

  /**
   * Change password for currently logged-in user
   * Used by first-time students to change default password
   */
  const changePassword = async (newPassword: string) => {
    if (!currentUser) throw new Error('No user logged in');
    try {
      await firebaseUpdatePassword(currentUser, newPassword);
      await updateDoc(doc(db, 'users', currentUser.uid), { firstLogin: false });
      setUserData(prev => prev ? { ...prev, firstLogin: false } : null);
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        throw new Error('Session expired. Please login again and change your password.');
      }
      throw new Error(getFriendlyErrorMessage(error));
    }
  };

  const value: AuthContextType = {
    currentUser,
    userData,
    loading,
    login,
    logout,
    resetPassword,
    updateUserData,
    changePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/** Convert Firebase error codes to friendly messages */
function getFriendlyErrorMessage(error: any): string {
  const code = typeof error?.code === 'string' ? error.code : '';

  const errorMap: Record<string, string> = {
    'auth/email-already-in-use': 'This email is already registered',
    'auth/invalid-email': 'Invalid email address',
    'auth/weak-password': 'Password should be at least 6 characters',
    'auth/user-disabled': 'This account has been disabled',
    'auth/user-not-found': 'No account found with this email',
    'auth/wrong-password': 'Incorrect password',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later',
    'auth/invalid-credential': 'Invalid email or password',
    'auth/invalid-api-key': 'Firebase API key is invalid. Check your config.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'permission-denied': 'Permission denied. Check Firestore rules.',
    'failed-precondition': 'Firestore is not enabled. Enable it in Firebase Console.',
  };

  if (errorMap[code]) return errorMap[code];
  if (error?.message && code) return `${error.message} (${code})`;
  if (error?.message) return String(error.message);
  return 'An error occurred. Please try again.';
}

export default AuthProvider;
