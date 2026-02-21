/**
 * Firestore Service for Practice Interview data
 * Stores interview history, evaluations, and feedback
 */

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import type { InterviewRound, InterviewFeedback } from './geminiService';

export interface PracticeInterviewRecord {
  id?: string;
  userId: string;
  userName: string;
  roundType: InterviewRound;
  totalQuestions: number;
  overallScore: number;
  maxScore: number;
  percentage: number;
  questionResults: {
    question: string;
    answer: string;
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  }[];
  overallFeedback: string;
  tips: string[];
  duration: number; // in seconds
  createdAt?: any;
}

/**
 * Save a completed practice interview to Firestore
 */
export async function savePracticeInterview(
  data: Omit<PracticeInterviewRecord, 'id' | 'createdAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'practiceInterviews'), {
    ...data,
    createdAt: serverTimestamp()
  });
  return ref.id;
}

/**
 * Subscribe to user's practice interview history
 */
export function subscribeToPracticeInterviews(
  userId: string,
  callback: (records: PracticeInterviewRecord[]) => void
) {
  // Using only where() to avoid composite index requirement
  const q = query(
    collection(db, 'practiceInterviews'),
    where('userId', '==', userId)
  );
  
  return onSnapshot(q, (snapshot) => {
    const records = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() } as PracticeInterviewRecord))
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
    callback(records);
  }, (error) => {
    console.error('Error fetching practice interviews:', error);
    callback([]);
  });
}

/**
 * Get user's practice interview statistics
 */
export function getUserInterviewStats(records: PracticeInterviewRecord[]) {
  if (records.length === 0) {
    return {
      totalPractices: 0,
      averageScore: 0,
      bestScore: 0,
      technicalCount: 0,
      hrCount: 0,
      aptitudeCount: 0,
      recentImprovement: 0
    };
  }

  const totalPractices = records.length;
  const averageScore = Math.round(
    records.reduce((sum, r) => sum + r.percentage, 0) / totalPractices
  );
  const bestScore = Math.max(...records.map(r => r.percentage));
  const technicalCount = records.filter(r => r.roundType === 'Technical').length;
  const hrCount = records.filter(r => r.roundType === 'HR').length;
  const aptitudeCount = records.filter(r => r.roundType === 'Aptitude').length;

  // Calculate improvement (compare last 3 vs previous 3)
  let recentImprovement = 0;
  if (records.length >= 4) {
    const recent3 = records.slice(0, 3).reduce((s, r) => s + r.percentage, 0) / 3;
    const prev3 = records.slice(3, 6).reduce((s, r) => s + r.percentage, 0) / Math.min(3, records.length - 3);
    recentImprovement = Math.round(recent3 - prev3);
  }

  return {
    totalPractices,
    averageScore,
    bestScore,
    technicalCount,
    hrCount,
    aptitudeCount,
    recentImprovement
  };
}
