/**
 * AI Practice Interview Page
 * Voice-based mock interview with Gemini AI
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Mic, MicOff, Play, Square, Brain, Monitor, Users, BookOpen,
  CheckCircle, XCircle, Loader2, Volume2, VolumeX, RotateCcw,
  ChevronRight, Trophy, Target, Clock, MessageSquare, ArrowRight
} from 'lucide-react';
import { InterviewRound, generateInterviewQuestions, evaluateAnswer, generateOverallFeedback, GeneratedQuestion, AnswerEvaluation } from '@/lib/geminiService';
import { SpeechService } from '@/lib/speechService';
import { savePracticeInterview, subscribeToPracticeInterviews, getUserInterviewStats, PracticeInterviewRecord } from '@/lib/interviewFirestore';
import { Link } from 'react-router-dom';

type InterviewState = 'idle' | 'selecting' | 'preparing' | 'asking' | 'listening' | 'evaluating' | 'feedback' | 'completed';

const PracticeInterview: React.FC = () => {
  const { currentUser, userData } = useAuth();
  const { toast } = useToast();

  // Interview state
  const [state, setState] = useState<InterviewState>('idle');
  const [selectedRound, setSelectedRound] = useState<InterviewRound | null>(null);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [evaluations, setEvaluations] = useState<AnswerEvaluation[]>([]);
  const [interimText, setInterimText] = useState('');
  const [overallFeedback, setOverallFeedback] = useState<{ overallFeedback: string; tips: string[] } | null>(null);
  const [startTime, setStartTime] = useState<number>(0);

  // History
  const [history, setHistory] = useState<PracticeInterviewRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Services
  const speechRef = useRef<SpeechService | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Load speech service
  useEffect(() => {
    speechRef.current = new SpeechService();
    // Load voices
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
    return () => {
      speechRef.current?.cleanup();
    };
  }, []);

  // Load history
  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsubscribe = subscribeToPracticeInterviews(currentUser.uid, (records) => {
      setHistory(records);
      setLoadingHistory(false);
    });
    return unsubscribe;
  }, [currentUser?.uid]);

  const stats = getUserInterviewStats(history);

  const startInterview = useCallback(async (round: InterviewRound) => {
    if (!SpeechService.isSupported()) {
      toast({ title: 'Not Supported', description: 'Speech recognition is not supported in your browser. Please use Chrome.', variant: 'destructive' });
      return;
    }

    setSelectedRound(round);
    setState('preparing');
    setQuestions([]);
    setAnswers([]);
    setEvaluations([]);
    setCurrentQuestionIndex(0);
    setOverallFeedback(null);
    setStartTime(Date.now());

    try {
      const generatedQuestions = await generateInterviewQuestions(round, 5);
      setQuestions(generatedQuestions);
      
      // Start asking first question
      setState('asking');
      await askQuestion(generatedQuestions[0], 0);
    } catch (error: any) {
      console.error('Failed to start interview:', error);
      toast({ title: 'Error', description: error.message || 'Failed to generate questions', variant: 'destructive' });
      setState('idle');
    }
  }, [toast]);

  const askQuestion = async (q: GeneratedQuestion, index: number) => {
    setState('asking');
    const speech = speechRef.current;
    if (!speech || isMuted) {
      // If muted, skip TTS and go straight to listening
      await new Promise(resolve => setTimeout(resolve, 1500));
      startListening();
      return;
    }

    const intro = index === 0 
      ? `Let's begin your ${selectedRound} interview. Here's your first question. ` 
      : `Question ${index + 1}. `;
    
    await speech.speak(intro + q.question);
    startListening();
  };

  const startListening = () => {
    setState('listening');
    setInterimText('');
    const speech = speechRef.current;
    if (!speech) return;

    speech.startListening(4000, (text) => {
      setInterimText(text);
    }).then(async (finalText) => {
      const answer = finalText || '(No answer provided)';
      const newAnswers = [...answers, answer];
      setAnswers(newAnswers);
      setInterimText('');

      // Evaluate answer
      setState('evaluating');
      const evaluation = await evaluateAnswer(
        questions[currentQuestionIndex].question,
        answer,
        selectedRound!
      );
      const newEvaluations = [...evaluations, evaluation];
      setEvaluations(newEvaluations);

      // Show brief feedback
      setState('feedback');
      
      if (!isMuted && speechRef.current) {
        await speechRef.current.speak(`Score: ${evaluation.score} out of 10. ${evaluation.feedback}`);
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if more questions
      const nextIndex = currentQuestionIndex + 1;
      if (nextIndex < questions.length) {
        setCurrentQuestionIndex(nextIndex);
        await askQuestion(questions[nextIndex], nextIndex);
      } else {
        // Interview complete
        await completeInterview(newAnswers, newEvaluations);
      }
    }).catch((error) => {
      console.error('Listening error:', error);
      // Treat as no answer
      const newAnswers = [...answers, '(No answer provided)'];
      setAnswers(newAnswers);
      handleNoAnswer(newAnswers);
    });
  };

  const handleNoAnswer = async (currentAnswers: string[]) => {
    const evaluation: AnswerEvaluation = {
      score: 0,
      feedback: 'No answer was detected.',
      strengths: [],
      improvements: ['Make sure to speak clearly into your microphone']
    };
    const newEvaluations = [...evaluations, evaluation];
    setEvaluations(newEvaluations);

    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < questions.length) {
      setCurrentQuestionIndex(nextIndex);
      await askQuestion(questions[nextIndex], nextIndex);
    } else {
      await completeInterview(currentAnswers, newEvaluations);
    }
  };

  const completeInterview = async (finalAnswers: string[], finalEvaluations: AnswerEvaluation[]) => {
    setState('completed');
    
    if (!isMuted && speechRef.current) {
      await speechRef.current.speak('The interview is now complete. Let me prepare your feedback.');
    }

    // Generate overall feedback
    const results = questions.map((q, i) => ({
      question: q.question,
      answer: finalAnswers[i] || '',
      score: finalEvaluations[i]?.score || 0
    }));

    const overall = await generateOverallFeedback(selectedRound!, results);
    setOverallFeedback(overall);

    // Save to Firestore
    const totalScore = finalEvaluations.reduce((s, e) => s + e.score, 0);
    const maxScore = questions.length * 10;
    const percentage = Math.round((totalScore / maxScore) * 100);
    const duration = Math.round((Date.now() - startTime) / 1000);

    try {
      await savePracticeInterview({
        userId: currentUser!.uid,
        userName: userData?.name || 'Student',
        roundType: selectedRound!,
        totalQuestions: questions.length,
        overallScore: totalScore,
        maxScore,
        percentage,
        questionResults: questions.map((q, i) => ({
          question: q.question,
          answer: finalAnswers[i] || '',
          score: finalEvaluations[i]?.score || 0,
          feedback: finalEvaluations[i]?.feedback || '',
          strengths: finalEvaluations[i]?.strengths || [],
          improvements: finalEvaluations[i]?.improvements || []
        })),
        overallFeedback: overall.overallFeedback,
        tips: overall.tips,
        duration
      });
    } catch (error) {
      console.error('Failed to save interview:', error);
    }
  };

  const stopInterview = () => {
    speechRef.current?.cleanup();
    setState('idle');
    setSelectedRound(null);
    setQuestions([]);
    setAnswers([]);
    setEvaluations([]);
    setCurrentQuestionIndex(0);
    setOverallFeedback(null);
  };

  const toggleMute = () => {
    if (!isMuted) {
      speechRef.current?.stopSpeaking();
    }
    setIsMuted(!isMuted);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Recently';
    if (timestamp?.toDate) return timestamp.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 70) return 'text-success';
    if (percentage >= 40) return 'text-warning';
    return 'text-destructive';
  };

  const getRoundIcon = (round: InterviewRound) => {
    switch (round) {
      case 'Technical': return <Monitor className="w-5 h-5" />;
      case 'HR': return <Users className="w-5 h-5" />;
      case 'Aptitude': return <BookOpen className="w-5 h-5" />;
    }
  };

  // ============ RENDER ============

  // Active interview view
  if (state !== 'idle' && state !== 'selecting') {
    const progress = questions.length > 0 ? ((currentQuestionIndex + (state === 'completed' ? 1 : 0)) / questions.length) * 100 : 0;

    return (
      <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">{selectedRound} Interview</h2>
              <p className="text-sm text-muted-foreground">Question {Math.min(currentQuestionIndex + 1, questions.length)} of {questions.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={toggleMute}>
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            <Button variant="destructive" size="sm" onClick={stopInterview}>
              <Square className="w-4 h-4 mr-1" /> End
            </Button>
          </div>
        </div>

        <Progress value={progress} className="h-2" />

        {/* Preparing */}
        {state === 'preparing' && (
          <Card className="bg-gradient-card border-border">
            <CardContent className="p-12 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Preparing Your Interview...</h3>
              <p className="text-muted-foreground">Generating {selectedRound} questions with AI</p>
            </CardContent>
          </Card>
        )}

        {/* Asking Question */}
        {state === 'asking' && questions[currentQuestionIndex] && (
          <Card className="bg-gradient-card border-border animate-pulse-glow">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                <Volume2 className="w-8 h-8 text-primary animate-pulse" />
              </div>
              <p className="text-lg text-foreground font-medium leading-relaxed">
                {questions[currentQuestionIndex].question}
              </p>
              <p className="text-sm text-muted-foreground mt-4">🔊 Asking question...</p>
            </CardContent>
          </Card>
        )}

        {/* Listening */}
        {state === 'listening' && (
          <Card className="bg-gradient-card border-border">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
                <Mic className="w-10 h-10 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Your Turn to Speak</h3>
              <p className="text-sm text-muted-foreground mb-4">Speak clearly. Will auto-detect when you finish.</p>
              
              {questions[currentQuestionIndex] && (
                <div className="mb-4 p-3 rounded-lg bg-secondary/50 text-left">
                  <p className="text-sm text-muted-foreground font-medium">Q: {questions[currentQuestionIndex].question}</p>
                </div>
              )}

              {interimText && (
                <div className="p-4 rounded-lg bg-secondary/30 border border-border text-left">
                  <p className="text-sm text-muted-foreground mb-1">Hearing:</p>
                  <p className="text-foreground">{interimText}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Evaluating */}
        {state === 'evaluating' && (
          <Card className="bg-gradient-card border-border">
            <CardContent className="p-8 text-center">
              <Loader2 className="w-10 h-10 animate-spin text-warning mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Evaluating Your Answer...</h3>
              <p className="text-sm text-muted-foreground">AI is analyzing your response</p>
            </CardContent>
          </Card>
        )}

        {/* Brief Feedback */}
        {state === 'feedback' && evaluations[currentQuestionIndex] && (
          <Card className="bg-gradient-card border-border">
            <CardContent className="p-8 text-center">
              <div className={`text-4xl font-bold mb-2 ${getScoreColor(evaluations[currentQuestionIndex].score * 10)}`}>
                {evaluations[currentQuestionIndex].score}/10
              </div>
              <p className="text-foreground mb-2">{evaluations[currentQuestionIndex].feedback}</p>
              <p className="text-sm text-muted-foreground">Moving to next question...</p>
            </CardContent>
          </Card>
        )}

        {/* Interview Complete */}
        {state === 'completed' && (
          <div className="space-y-6">
            {/* Overall Score Card */}
            <Card className="bg-gradient-card border-border">
              <CardContent className="p-8 text-center">
                <Trophy className="w-12 h-12 text-warning mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">Interview Complete!</h3>
                {evaluations.length > 0 && (
                  <>
                    <div className={`text-5xl font-bold my-4 ${getScoreColor(
                      Math.round((evaluations.reduce((s, e) => s + e.score, 0) / (questions.length * 10)) * 100)
                    )}`}>
                      {Math.round((evaluations.reduce((s, e) => s + e.score, 0) / (questions.length * 10)) * 100)}%
                    </div>
                    <p className="text-muted-foreground">
                      Score: {evaluations.reduce((s, e) => s + e.score, 0)}/{questions.length * 10}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Overall Feedback */}
            {overallFeedback ? (
              <Card className="bg-gradient-card border-border">
                <CardHeader><CardTitle className="text-lg">Overall Feedback</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-foreground">{overallFeedback.overallFeedback}</p>
                  <div>
                    <h4 className="font-medium text-foreground mb-2">💡 Tips for Improvement</h4>
                    <ul className="space-y-2">
                      {overallFeedback.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <ChevronRight className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gradient-card border-border">
                <CardContent className="p-6 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Generating feedback...</p>
                </CardContent>
              </Card>
            )}

            {/* Per-question breakdown */}
            <Card className="bg-gradient-card border-border">
              <CardHeader><CardTitle className="text-lg">Question-by-Question Review</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {questions.map((q, i) => (
                  <div key={i} className="p-4 rounded-lg bg-secondary/30 border border-border space-y-2">
                    <div className="flex items-start justify-between">
                      <p className="font-medium text-foreground text-sm flex-1">Q{i + 1}: {q.question}</p>
                      <Badge className={`ml-2 ${
                        (evaluations[i]?.score || 0) >= 7 ? 'bg-success/20 text-success' :
                        (evaluations[i]?.score || 0) >= 4 ? 'bg-warning/20 text-warning' :
                        'bg-destructive/20 text-destructive'
                      }`}>{evaluations[i]?.score || 0}/10</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground"><strong>Your Answer:</strong> {answers[i] || '(No answer)'}</p>
                    <p className="text-sm text-muted-foreground">{evaluations[i]?.feedback}</p>
                    {evaluations[i]?.strengths?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {evaluations[i].strengths.map((s, j) => (
                          <span key={j} className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success">✓ {s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3 justify-center">
              <Button onClick={() => startInterview(selectedRound!)} className="bg-gradient-primary">
                <RotateCcw className="w-4 h-4 mr-2" /> Practice Again
              </Button>
              <Button variant="outline" onClick={stopInterview}>
                Back to Menu
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============ MAIN MENU ============
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" /> AI Practice Interview
          </h2>
          <p className="text-muted-foreground">Practice with AI-powered voice interviews</p>
        </div>
        {history.length > 0 && (
          <Link to="/dashboard/interview-history">
            <Button variant="outline" size="sm">
              View Full History <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-card border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{stats.totalPractices}</p>
            <p className="text-sm text-muted-foreground">Total Practices</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border">
          <CardContent className="p-4 text-center">
            <p className={`text-2xl font-bold ${getScoreColor(stats.averageScore)}`}>{stats.averageScore}%</p>
            <p className="text-sm text-muted-foreground">Avg Score</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-success">{stats.bestScore}%</p>
            <p className="text-sm text-muted-foreground">Best Score</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border">
          <CardContent className="p-4 text-center">
            <p className={`text-2xl font-bold ${stats.recentImprovement >= 0 ? 'text-success' : 'text-destructive'}`}>
              {stats.recentImprovement > 0 ? '+' : ''}{stats.recentImprovement}%
            </p>
            <p className="text-sm text-muted-foreground">Improvement</p>
          </CardContent>
        </Card>
      </div>

      {/* Round Selection */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Select Interview Round</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['Technical', 'HR', 'Aptitude'] as InterviewRound[]).map((round) => (
              <button
                key={round}
                onClick={() => startInterview(round)}
                className="p-6 rounded-xl bg-secondary/50 border border-border hover:border-primary/50 transition-all hover-glow text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors">
                  {getRoundIcon(round)}
                </div>
                <h3 className="font-semibold text-foreground mb-1">{round} Round</h3>
                <p className="text-sm text-muted-foreground">
                  {round === 'Technical' && 'DSA, OOP, DBMS, OS & more'}
                  {round === 'HR' && 'Behavioral, strengths, goals'}
                  {round === 'Aptitude' && 'Logical reasoning & problem solving'}
                </p>
                <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                  <Mic className="w-3 h-3" /> Voice interview • 5 Questions
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Practiced: {round === 'Technical' ? stats.technicalCount : round === 'HR' ? stats.hrCount : stats.aptitudeCount} times
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent History */}
      {history.length > 0 && (
        <Card className="bg-gradient-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Practice Sessions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {history.slice(0, 5).map((record) => (
              <div key={record.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    {getRoundIcon(record.roundType)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{record.roundType} Round</p>
                    <p className="text-xs text-muted-foreground">{formatDate(record.createdAt)} • {formatDuration(record.duration)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${getScoreColor(record.percentage)}`}>{record.percentage}%</p>
                  <p className="text-xs text-muted-foreground">{record.overallScore}/{record.maxScore}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Browser Compatibility Note */}
      {!SpeechService.isSupported() && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-4 flex items-center gap-3">
            <MicOff className="w-5 h-5 text-destructive" />
            <div>
              <p className="font-medium text-foreground">Speech Recognition Not Supported</p>
              <p className="text-sm text-muted-foreground">Please use Google Chrome for the best experience with voice interviews.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PracticeInterview;
