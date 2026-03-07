/**
 * AI Practice Interview Page — Production-Grade Voice Interview System
 * Supports two modes:
 * 1. Vapi AI mode: Real-time voice conversation with AI interviewer
 * 2. Speech API mode: Fallback using Web Speech API
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Brain, Hash, TrendingUp, Award, Zap, Clock, ArrowRight, Play
} from 'lucide-react';
import {
  InterviewConfig, InterviewType, GeneratedQuestion, AnswerEvaluation, DetailedFeedback,
  TranscriptEvaluation, generateInterviewQuestions, evaluateAnswer, evaluateTranscript,
  generateOverallFeedback
} from '@/lib/geminiService';
import { VapiService, VapiTranscriptMessage, isVapiAvailable } from '@/lib/vapiService';
import { SpeechService } from '@/lib/speechService';
import { savePracticeInterview, subscribeToPracticeInterviews, getUserInterviewStats, PracticeInterviewRecord } from '@/lib/interviewFirestore';
import { Link } from 'react-router-dom';
import InterviewSetup from '@/components/interview/InterviewSetup';
import InterviewSession from '@/components/interview/InterviewSession';
import InterviewFeedbackView from '@/components/interview/InterviewFeedback';

type PageState = 'home' | 'setup' | 'active' | 'completed';
type SpeechInterviewState = 'asking' | 'listening' | 'evaluating' | 'feedback';

const PracticeInterview: React.FC = () => {
  const { currentUser, userData } = useAuth();
  const { toast } = useToast();

  // Page state
  const [pageState, setPageState] = useState<PageState>('home');
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [interviewMode, setInterviewMode] = useState<'vapi' | 'speech'>('speech');
  const [isLoading, setIsLoading] = useState(false);

  // Vapi state
  const vapiRef = useRef<VapiService | null>(null);
  const [vapiTranscript, setVapiTranscript] = useState<VapiTranscriptMessage[]>([]);
  const [isVapiConnecting, setIsVapiConnecting] = useState(false);
  const [isVapiActive, setIsVapiActive] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);

  // Speech mode state
  const speechRef = useRef<SpeechService | null>(null);
  const [speechState, setSpeechState] = useState<SpeechInterviewState>('asking');
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [evaluations, setEvaluations] = useState<AnswerEvaluation[]>([]);
  const [interimText, setInterimText] = useState('');
  const [currentFeedbackItem, setCurrentFeedbackItem] = useState<{ score: number; feedback: string } | null>(null);

  // Common state
  const [startTime, setStartTime] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [transcriptEvaluation, setTranscriptEvaluation] = useState<TranscriptEvaluation | null>(null);
  const [overallFeedback, setOverallFeedback] = useState<DetailedFeedback | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // History
  const [history, setHistory] = useState<PracticeInterviewRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Timer
  useEffect(() => {
    if (pageState !== 'active' || !startTime) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [pageState, startTime]);

  // Load speech service
  useEffect(() => {
    speechRef.current = new SpeechService();
    return () => speechRef.current?.cleanup();
  }, []);

  // Load history
  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsub = subscribeToPracticeInterviews(currentUser.uid, (records) => {
      setHistory(records);
      setLoadingHistory(false);
    });
    return unsub;
  }, [currentUser?.uid]);

  const stats = getUserInterviewStats(history);

  // ========== START INTERVIEW ==========
  const handleStartInterview = useCallback(async (cfg: InterviewConfig) => {
    setConfig(cfg);
    setIsLoading(true);
    setStartTime(Date.now());
    setElapsedSeconds(0);
    setVapiTranscript([]);
    setQuestions([]);
    setAnswers([]);
    setEvaluations([]);
    setCurrentQuestionIndex(0);
    setOverallFeedback(null);
    setTranscriptEvaluation(null);
    setCurrentFeedbackItem(null);

    // Try Vapi first, fall back to Speech API
    if (isVapiAvailable()) {
      try {
        setInterviewMode('vapi');
        setPageState('active');
        setIsVapiConnecting(true);

        const vapi = new VapiService();
        vapiRef.current = vapi;

        vapi.setCallbacks({
          onCallStart: () => {
            setIsVapiConnecting(false);
            setIsVapiActive(true);
          },
          onCallEnd: () => {
            setIsVapiActive(false);
            handleVapiCallEnd(vapi, cfg);
          },
          onSpeechStart: () => setAiSpeaking(true),
          onSpeechEnd: () => setAiSpeaking(false),
          onTranscript: (msg) => {
            setVapiTranscript(prev => [...prev, msg]);
            if (msg.role === 'user') setUserSpeaking(false);
            else setAiSpeaking(false);
          },
          onVolumeLevel: (level) => setVolumeLevel(level),
          onError: (error) => {
            console.error('Vapi error:', error);
            toast({ title: 'Voice Error', description: 'Falling back to speech mode.', variant: 'destructive' });
            vapi.cleanup();
            startSpeechMode(cfg);
          },
        });

        // Generate questions with Gemini first
        const genQuestions = await generateInterviewQuestions(cfg);
        setQuestions(genQuestions);

        await vapi.startCall({
          interviewType: cfg.type,
          role: cfg.role,
          techStack: cfg.techStack,
          experienceLevel: cfg.experienceLevel,
          questions: genQuestions.map(q => q.question),
        });

        setIsLoading(false);
      } catch (error: any) {
        console.error('Vapi start failed:', error);
        toast({ title: 'Voice Connection Failed', description: 'Using speech-based interview instead.', variant: 'destructive' });
        startSpeechMode(cfg);
      }
    } else {
      await startSpeechMode(cfg);
    }
  }, [toast]);

  // ========== SPEECH MODE ==========
  const startSpeechMode = async (cfg: InterviewConfig) => {
    setInterviewMode('speech');
    setPageState('active');
    setIsLoading(true);

    try {
      const genQuestions = await generateInterviewQuestions(cfg);
      setQuestions(genQuestions);
      setIsLoading(false);
      setSpeechState('asking');
      await askSpeechQuestion(genQuestions[0], 0, cfg);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to generate questions', variant: 'destructive' });
      setPageState('home');
      setIsLoading(false);
    }
  };

  const askSpeechQuestion = async (q: GeneratedQuestion, index: number, cfg?: InterviewConfig) => {
    setSpeechState('asking');
    setAiSpeaking(true);

    const intro = index === 0
      ? `Let's begin your ${cfg?.type || config?.type} interview. Here's your first question. `
      : `Question ${index + 1}. `;

    setVapiTranscript(prev => [...prev, { role: 'assistant', text: q.question, timestamp: Date.now() }]);

    const speech = speechRef.current;
    if (speech && !isMuted) {
      await speech.speak(intro + q.question);
    } else {
      await new Promise(r => setTimeout(r, 1500));
    }
    setAiSpeaking(false);
    startSpeechListening();
  };

  const startSpeechListening = () => {
    setSpeechState('listening');
    setInterimText('');
    setUserSpeaking(true);
    const speech = speechRef.current;
    if (!speech) return;

    speech.startListening(4000, (text) => setInterimText(text))
      .then(async (finalText) => {
        setUserSpeaking(false);
        const answer = finalText || '(No answer provided)';
        const newAnswers = [...answers, answer];
        setAnswers(newAnswers);
        setInterimText('');
        setVapiTranscript(prev => [...prev, { role: 'user', text: answer, timestamp: Date.now() }]);

        setSpeechState('evaluating');
        const evaluation = await evaluateAnswer(
          questions[currentQuestionIndex].question,
          answer,
          config?.type || 'Technical'
        );
        const newEvaluations = [...evaluations, evaluation];
        setEvaluations(newEvaluations);

        setSpeechState('feedback');
        setCurrentFeedbackItem({ score: evaluation.score, feedback: evaluation.feedback });
        setAiSpeaking(true);

        if (!isMuted && speechRef.current) {
          await speechRef.current.speak(`Score: ${evaluation.score} out of 10. ${evaluation.feedback}`);
        }
        setAiSpeaking(false);

        await new Promise(r => setTimeout(r, 2000));
        setCurrentFeedbackItem(null);

        const nextIndex = currentQuestionIndex + 1;
        if (nextIndex < questions.length) {
          setCurrentQuestionIndex(nextIndex);
          await askSpeechQuestion(questions[nextIndex], nextIndex);
        } else {
          await completeSpeechInterview(newAnswers, newEvaluations);
        }
      })
      .catch(() => {
        setUserSpeaking(false);
        const newAnswers = [...answers, '(No answer provided)'];
        setAnswers(newAnswers);
        const evaluation: AnswerEvaluation = { score: 0, feedback: 'No answer detected.', strengths: [], improvements: ['Speak clearly into your microphone'] };
        const newEvaluations = [...evaluations, evaluation];
        setEvaluations(newEvaluations);

        const nextIndex = currentQuestionIndex + 1;
        if (nextIndex < questions.length) {
          setCurrentQuestionIndex(nextIndex);
          askSpeechQuestion(questions[nextIndex], nextIndex);
        } else {
          completeSpeechInterview(newAnswers, newEvaluations);
        }
      });
  };

  const completeSpeechInterview = async (finalAnswers: string[], finalEvals: AnswerEvaluation[]) => {
    setPageState('completed');
    setIsEvaluating(true);

    if (!isMuted && speechRef.current) {
      await speechRef.current.speak('The interview is now complete. Let me prepare your detailed feedback.');
    }

    const results = questions.map((q, i) => ({
      question: q.question,
      answer: finalAnswers[i] || '',
      score: finalEvals[i]?.score || 0,
    }));

    const feedback = await generateOverallFeedback(config?.type || 'Technical', results);
    setOverallFeedback(feedback);
    setIsEvaluating(false);

    // Save to Firestore
    const totalScore = finalEvals.reduce((s, e) => s + e.score, 0);
    const maxScore = questions.length * 10;
    const percentage = Math.round((totalScore / maxScore) * 100);
    const duration = Math.round((Date.now() - startTime) / 1000);

    try {
      await savePracticeInterview({
        userId: currentUser!.uid,
        userName: userData?.name || 'Student',
        roundType: (config?.type === 'Behavioral' ? 'HR' : config?.type === 'System Design' ? 'Technical' : config?.type || 'Technical') as any,
        totalQuestions: questions.length,
        overallScore: totalScore,
        maxScore,
        percentage,
        questionResults: questions.map((q, i) => ({
          question: q.question,
          answer: finalAnswers[i] || '',
          score: finalEvals[i]?.score || 0,
          feedback: finalEvals[i]?.feedback || '',
          strengths: finalEvals[i]?.strengths || [],
          improvements: finalEvals[i]?.improvements || [],
        })),
        overallFeedback: feedback.overallFeedback,
        tips: feedback.tips,
        duration,
      });
    } catch (error) {
      console.error('Failed to save interview:', error);
    }
  };

  // ========== VAPI CALL END ==========
  const handleVapiCallEnd = async (vapi: VapiService, cfg: InterviewConfig) => {
    setPageState('completed');
    setIsEvaluating(true);

    const transcriptText = vapi.getTranscriptText();
    const transcriptMessages = vapi.getTranscript();

    try {
      const evaluation = await evaluateTranscript(transcriptText, cfg.type, cfg.role);
      setTranscriptEvaluation(evaluation);

      // Save to Firestore
      const duration = Math.round((Date.now() - startTime) / 1000);
      await savePracticeInterview({
        userId: currentUser!.uid,
        userName: userData?.name || 'Student',
        roundType: (cfg.type === 'Behavioral' ? 'HR' : cfg.type === 'System Design' ? 'Technical' : cfg.type || 'Technical') as any,
        totalQuestions: evaluation.questionBreakdown.length,
        overallScore: Math.round(evaluation.score / 10),
        maxScore: 10,
        percentage: evaluation.score,
        questionResults: evaluation.questionBreakdown.map(q => ({
          question: q.question,
          answer: q.answer,
          score: q.score,
          feedback: q.feedback,
          strengths: q.strengths,
          improvements: q.improvements,
        })),
        overallFeedback: evaluation.finalVerdict,
        tips: evaluation.improvements,
        duration,
      });
    } catch (error) {
      console.error('Failed to evaluate transcript:', error);
    }

    setIsEvaluating(false);
  };

  // ========== END / STOP ==========
  const handleEndCall = () => {
    if (interviewMode === 'vapi' && vapiRef.current) {
      vapiRef.current.stopCall();
    } else {
      speechRef.current?.cleanup();
      completeSpeechInterview(answers, evaluations);
    }
  };

  const handleToggleMute = () => {
    if (interviewMode === 'vapi' && vapiRef.current) {
      const muted = vapiRef.current.toggleMute();
      setIsMuted(muted);
    } else {
      if (!isMuted) speechRef.current?.stopSpeaking();
      setIsMuted(!isMuted);
    }
  };

  const resetAll = () => {
    vapiRef.current?.cleanup();
    speechRef.current?.cleanup();
    setPageState('home');
    setConfig(null);
    setVapiTranscript([]);
    setQuestions([]);
    setAnswers([]);
    setEvaluations([]);
    setCurrentQuestionIndex(0);
    setOverallFeedback(null);
    setTranscriptEvaluation(null);
    setIsLoading(false);
    setIsVapiActive(false);
    setIsVapiConnecting(false);
    setAiSpeaking(false);
    setUserSpeaking(false);
  };

  // ========== RENDER ==========

  // Active Interview
  if (pageState === 'active' && config) {
    return (
      <InterviewSession
        config={config}
        isConnecting={isLoading || isVapiConnecting}
        isActive={interviewMode === 'vapi' ? isVapiActive : true}
        aiSpeaking={aiSpeaking}
        userSpeaking={userSpeaking}
        isMuted={isMuted}
        volumeLevel={volumeLevel}
        transcript={vapiTranscript}
        userName={userData?.name || 'You'}
        onEndCall={handleEndCall}
        onToggleMute={handleToggleMute}
        elapsedSeconds={elapsedSeconds}
        mode={interviewMode}
        speechState={speechState}
        currentQuestion={questions[currentQuestionIndex]?.question}
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={questions.length}
        interimText={interimText}
        currentFeedback={currentFeedbackItem}
      />
    );
  }

  // Completed / Feedback
  if (pageState === 'completed' && config) {
    return (
      <InterviewFeedbackView
        config={config}
        transcriptEvaluation={interviewMode === 'vapi' ? transcriptEvaluation : undefined}
        transcript={vapiTranscript.length > 0 ? vapiTranscript : undefined}
        overallFeedback={interviewMode === 'speech' ? overallFeedback : undefined}
        questions={interviewMode === 'speech' ? questions : undefined}
        answers={interviewMode === 'speech' ? answers : undefined}
        evaluations={interviewMode === 'speech' ? evaluations : undefined}
        duration={elapsedSeconds}
        isEvaluating={isEvaluating}
        onRetry={() => {
          resetAll();
          setPageState('setup');
        }}
        onNewInterview={() => {
          resetAll();
          setPageState('setup');
        }}
      />
    );
  }

  // Setup
  if (pageState === 'setup') {
    return (
      <div className="space-y-4 animate-fade-in">
        <Button variant="ghost" size="sm" onClick={() => setPageState('home')}>← Back to Dashboard</Button>
        <InterviewSetup onStart={handleStartInterview} isLoading={isLoading} />
      </div>
    );
  }

  // ========== HOME / DASHBOARD ==========
  const getScoreColor = (pct: number) => {
    if (pct >= 70) return 'text-emerald-400';
    if (pct >= 40) return 'text-amber-400';
    return 'text-red-400';
  };

  const formatDate = (ts: any) => {
    if (!ts) return 'Recently';
    if (ts?.toDate) return ts.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDuration = (secs: number) => `${Math.floor(secs / 60)}m ${secs % 60}s`;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-transparent border border-border p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">AI Interview Studio</h1>
            </div>
            <p className="text-muted-foreground max-w-md">
              Practice with voice-powered AI interviews. Choose your type, configure difficulty, and get instant AI feedback.
            </p>
          </div>
          <div className="flex gap-3">
            {history.length > 0 && (
              <Link to="/dashboard/interview-history">
                <Button variant="outline" className="gap-2 border-primary/30 hover:bg-primary/10">
                  View History <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            )}
            <Button className="bg-gradient-primary gap-2" onClick={() => setPageState('setup')}>
              <Play className="w-4 h-4" /> Start Interview
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Sessions', value: stats.totalPractices, icon: Hash, color: 'text-primary' },
          { label: 'Average Score', value: `${stats.averageScore}%`, icon: TrendingUp, color: getScoreColor(stats.averageScore) },
          { label: 'Best Score', value: `${stats.bestScore}%`, icon: Award, color: 'text-emerald-400' },
          { label: 'Improvement', value: `${stats.recentImprovement > 0 ? '+' : ''}${stats.recentImprovement}%`, icon: Zap, color: stats.recentImprovement >= 0 ? 'text-emerald-400' : 'text-red-400' },
        ].map((stat, i) => (
          <div key={i} className="glass-card rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent History */}
      {history.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" /> Recent Sessions
          </h2>
          <div className="space-y-2">
            {history.slice(0, 5).map((record) => (
              <div key={record.id} className="glass-card rounded-xl p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{record.roundType} Round</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(record.createdAt)} · {formatDuration(record.duration)} · {record.totalQuestions} questions
                    </p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-lg border ${
                  record.percentage >= 70 ? 'bg-emerald-500/20 border-emerald-500/30' :
                  record.percentage >= 40 ? 'bg-amber-500/20 border-amber-500/30' :
                  'bg-red-500/20 border-red-500/30'
                }`}>
                  <span className={`text-sm font-bold ${getScoreColor(record.percentage)}`}>{record.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No History State */}
      {history.length === 0 && !loadingHistory && (
        <div className="text-center py-12 glass-card rounded-2xl">
          <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Practice Sessions Yet</h3>
          <p className="text-muted-foreground mb-6">Start your first AI-powered interview practice!</p>
          <Button className="bg-gradient-primary gap-2" onClick={() => setPageState('setup')}>
            <Play className="w-4 h-4" /> Start Your First Interview
          </Button>
        </div>
      )}
    </div>
  );
};

export default PracticeInterview;
