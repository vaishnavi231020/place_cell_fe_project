/**
 * Custom hooks for real-time Firestore data subscriptions
 */

import { useState, useEffect } from 'react';
import {
  subscribeToCompanies,
  subscribeToJobPostings,
  subscribeToAllApplications,
  subscribeToUserApplications,
  subscribeToInterviews,
  subscribeToNotifications,
  subscribeToStudents,
  FirestoreCompany,
  FirestoreJobPosting,
  FirestoreApplication,
  FirestoreInterview,
  FirestoreNotification
} from '@/lib/firestoreService';

export function useCompanies() {
  const [companies, setCompanies] = useState<FirestoreCompany[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToCompanies((data) => {
      setCompanies(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { companies, loading };
}

export function useJobPostings() {
  const [jobPostings, setJobPostings] = useState<FirestoreJobPosting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToJobPostings((data) => {
      setJobPostings(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { jobPostings, loading };
}

export function useAllApplications() {
  const [applications, setApplications] = useState<FirestoreApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAllApplications((data) => {
      setApplications(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { applications, loading };
}

export function useUserApplications(userId: string | undefined) {
  const [applications, setApplications] = useState<FirestoreApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    const unsubscribe = subscribeToUserApplications(userId, (data) => {
      setApplications(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [userId]);

  return { applications, loading };
}

export function useInterviews() {
  const [interviews, setInterviews] = useState<FirestoreInterview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToInterviews((data) => {
      setInterviews(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { interviews, loading };
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<FirestoreNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToNotifications((data) => {
      setNotifications(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { notifications, loading };
}

export function useStudents() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToStudents((data) => {
      setStudents(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { students, loading };
}
