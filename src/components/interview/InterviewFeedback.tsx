/**
 * Interview Feedback Component
 * Shows detailed results after interview completion
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Trophy, Brain, Target, MessageSquare, BarChart3,
  ChevronDown, ChevronUp, Lightbulb, CircleCheck, CircleX,
  RotateCcw, ArrowRight, Shield, TrendingUp, Sparkles
} from 'lucide-react';
import type { TranscriptEvaluation, DetailedFeedback, InterviewConfig, AnswerEvaluation, GeneratedQuestion } from '@/lib/geminiService';
import type { VapiTranscriptMessage } from '@/lib/vapiService';
import { Link } from 'react-router-dom';

interface InterviewFeedbackProps {
  config: InterviewConfig;
  // Vapi mode
  transcriptEvaluation?: TranscriptEvaluation | null;
  transcript?: VapiTranscriptMessage[];
  // Speech mode
  overallFeedback?: DetailedFeedback | null;
  questions?: GeneratedQuestion[];
  answers?: string[];
  evaluations?: AnswerEvaluation[];
  // Common
  duration: number;
  isEvaluating: boolean;
  onRetry: () => void;
  onNewInterview: () => void;
}

const InterviewFeedback: React.FC<InterviewFeedbackProps> = ({
  config,
  transcriptEvaluation,
  transcript,
  overallFeedback,
  questions,
  answers,
  evaluations,
  duration,
  isEvaluating,
  onRetry,
  onNewInterview,
}) => {
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  // Determine data source
  const isVapiMode = !!transcriptEvaluation;
  const score = isVapiMode ? transcriptEvaluation!.score : 
    evaluations ? Math.round((evaluations.reduce((s, e) => s + e.score, 0) / (evaluations.length * 10)) * 100) : 0;
  const communication = isVapiMode ? transcriptEvaluation!.communication : (overallFeedback?.communication ?? 5);
  const technicalKnowledge = isVapiMode ? transcriptEvaluation!.technicalKnowledge : (overallFeedback?.technicalKnowledge ?? 5);
  const confidence = isVapiMode ? transcriptEvaluation!.confidence : (overallFeedback?.confidence ?? 5);
  const verdict = isVapiMode ? transcriptEvaluation!.finalVerdict : (overallFeedback?.finalVerdict ?? '');
  const strengths = isVapiMode ? transcriptEvaluation!.strengths : (overallFeedback?.tips ?? []);
  const weaknesses = isVapiMode ? transcriptEvaluation!.weaknesses : [];
  const improvements = isVapiMode ? transcriptEvaluation!.improvements : (overallFeedback?.tips ?? []);
  const questionResults = isVapiMode ? transcriptEvaluation!.questionBreakdown :
    (questions?.map((q, i) => ({
      question: q.question,
      answer: answers?.[i] || '',
      score: evaluations?.[i]?.score ?? 0,
      feedback: evaluations?.[i]?.feedback ?? '',
      strengths: evaluations?.[i]?.strengths ?? [],
      improvements: evaluations?.[i]?.improvements ?? [],
    })) ?? []);

  if (isEvaluating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-fade-in">
        <div className="relative w-28 h-28">
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="absolute inset-0 rounded-full bg-card border-2 border-primary/30 flex items-center justify-center">
            <Brain className="w-12 h-12 text-primary animate-pulse" />
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold text-foreground">Analyzing Your Interview</h3>
          <p className="text-sm text-muted-foreground mt-2">AI is evaluating your responses and preparing detailed feedback...</p>
        </div>
      </div>
    );
  }

  const getScoreColor = (pct: number) => {
    if (pct >= 70) return 'text-emerald-400';
    if (pct >= 40) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreBorderColor = (score: number) => {
    if (score >= 7) return 'border-emerald-500/50';
    if (score >= 4) return 'border-amber-500/50';
    return 'border-red-500/50';
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}m ${s}s`;
  };

  const ScoreRing = ({ value, label, max = 10 }: { value: number; label: string; max?: number }) => {
    const pct = (value / max) * 100;
    return (
      <div className="flex flex-col items-center gap-2">
        <div className={`relative w-16 h-16 rounded-full border-4 ${getScoreBorderColor(value)} flex items-center justify-center`}>
          <span className={`text-lg font-black ${getScoreColor(pct)}`}>{value}</span>
        </div>
        <span className="text-xs text-muted-foreground text-center">{label}</span>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-8">
      {/* Score Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-8">
        <div className="absolute top-4 left-4">
          <Badge variant="outline" className="text-xs">{config.type} · {config.role}</Badge>
        </div>
        <div className="text-center">
          <Trophy className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <div className={`text-6xl font-black ${getScoreColor(score)}`}>{score}%</div>
          <p className="text-muted-foreground mt-2">Overall Score</p>
          {verdict && (
            <p className="text-sm text-foreground mt-3 max-w-md mx-auto italic">"{verdict}"</p>
          )}
          <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground">
            <span>{formatDuration(duration)}</span>
            <span>·</span>
            <span>{questionResults.length} questions</span>
            <span>·</span>
            <span>{config.difficulty}</span>
          </div>
        </div>
      </div>

      {/* Skill Breakdown */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-5 flex flex-col items-center">
          <ScoreRing value={communication} label="Communication" />
        </div>
        <div className="glass-card rounded-xl p-5 flex flex-col items-center">
          <ScoreRing value={technicalKnowledge} label="Technical" />
        </div>
        <div className="glass-card rounded-xl p-5 flex flex-col items-center">
          <ScoreRing value={confidence} label="Confidence" />
        </div>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {strengths.length > 0 && (
          <div className="glass-card rounded-xl p-5 space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <CircleCheck className="w-4 h-4 text-emerald-400" /> Strengths
            </h4>
            <ul className="space-y-2">
              {strengths.map((s, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span> {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {(weaknesses.length > 0 || improvements.length > 0) && (
          <div className="glass-card rounded-xl p-5 space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" /> Areas to Improve
            </h4>
            <ul className="space-y-2">
              {[...weaknesses, ...improvements].slice(0, 5).map((w, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">→</span> {w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Question Breakdown */}
      {questionResults.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" /> Question Breakdown
          </h4>
          {questionResults.map((qr, i) => (
            <div key={i} className="glass-card rounded-xl overflow-hidden">
              <button
                className="w-full p-4 flex items-center justify-between text-left"
                onClick={() => setExpandedQ(expandedQ === i ? null : i)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${getScoreBorderColor(qr.score)}`}>
                    <span className={`text-xs font-bold ${getScoreColor(qr.score * 10)}`}>{qr.score}</span>
                  </div>
                  <p className="text-sm text-foreground truncate">{qr.question}</p>
                </div>
                {expandedQ === i ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
              </button>
              {expandedQ === i && (
                <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Your Answer</p>
                    <p className="text-sm text-foreground bg-secondary/30 rounded-lg p-3">{qr.answer || '(No answer provided)'}</p>
                  </div>
                  {qr.feedback && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Feedback</p>
                      <p className="text-sm text-muted-foreground">{qr.feedback}</p>
                    </div>
                  )}
                  {qr.strengths?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {qr.strengths.map((s, j) => (
                        <Badge key={j} variant="outline" className="text-xs bg-emerald-500/10 border-emerald-500/20 text-emerald-400">{s}</Badge>
                      ))}
                    </div>
                  )}
                  {qr.improvements?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {qr.improvements.map((imp, j) => (
                        <Badge key={j} variant="outline" className="text-xs bg-amber-500/10 border-amber-500/20 text-amber-400">{imp}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Full Transcript */}
      {transcript && transcript.length > 0 && (
        <div className="glass-card rounded-xl overflow-hidden">
          <button
            className="w-full p-4 flex items-center justify-between"
            onClick={() => setShowTranscript(!showTranscript)}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Full Transcript</span>
            </div>
            {showTranscript ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          {showTranscript && (
            <div className="px-4 pb-4 space-y-2 border-t border-border pt-3 max-h-80 overflow-y-auto">
              {transcript.map((item, i) => (
                <div key={i} className={`flex gap-2 ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {item.role === 'assistant' && (
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Brain className="w-2.5 h-2.5 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-lg px-3 py-1.5 text-sm ${
                    item.role === 'assistant' ? 'bg-muted text-foreground' : 'bg-primary/20 text-foreground'
                  }`}>
                    {item.text}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-center gap-4 pt-4">
        <Button variant="outline" className="gap-2" onClick={onRetry}>
          <RotateCcw className="w-4 h-4" /> Retry Same Type
        </Button>
        <Button className="bg-gradient-primary gap-2" onClick={onNewInterview}>
          <Sparkles className="w-4 h-4" /> New Interview
        </Button>
        <Link to="/dashboard/interview-history">
          <Button variant="outline" className="gap-2">
            View History <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default InterviewFeedback;
