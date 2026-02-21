/**
 * Interview Practice History Page
 * Shows detailed history and analytics of all practice sessions
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Brain, Monitor, Users, BookOpen, Trophy, Target, Clock,
  ChevronDown, ChevronUp, Loader2, ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { subscribeToPracticeInterviews, getUserInterviewStats, PracticeInterviewRecord } from '@/lib/interviewFirestore';
import type { InterviewRound } from '@/lib/geminiService';

const InterviewHistory: React.FC = () => {
  const { currentUser } = useAuth();
  const [records, setRecords] = useState<PracticeInterviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsubscribe = subscribeToPracticeInterviews(currentUser.uid, (data) => {
      setRecords(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [currentUser?.uid]);

  const stats = getUserInterviewStats(records);

  const getRoundIcon = (round: InterviewRound) => {
    switch (round) {
      case 'Technical': return <Monitor className="w-5 h-5" />;
      case 'HR': return <Users className="w-5 h-5" />;
      case 'Aptitude': return <BookOpen className="w-5 h-5" />;
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 70) return 'text-success';
    if (percentage >= 40) return 'text-warning';
    return 'text-destructive';
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Recently';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/practice-interview">
          <Button variant="outline" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Practice Interview History</h2>
          <p className="text-muted-foreground">{records.length} practice sessions completed</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-card border-border">
          <CardContent className="p-4 text-center">
            <Trophy className="w-6 h-6 text-warning mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats.bestScore}%</p>
            <p className="text-xs text-muted-foreground">Best Score</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border">
          <CardContent className="p-4 text-center">
            <Target className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats.averageScore}%</p>
            <p className="text-xs text-muted-foreground">Average Score</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border">
          <CardContent className="p-4 text-center">
            <Monitor className="w-6 h-6 text-info mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats.technicalCount}</p>
            <p className="text-xs text-muted-foreground">Technical</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border">
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats.hrCount + stats.aptitudeCount}</p>
            <p className="text-xs text-muted-foreground">HR + Aptitude</p>
          </CardContent>
        </Card>
      </div>

      {/* Records List */}
      <div className="space-y-3">
        {records.map((record) => (
          <Card key={record.id} className="bg-gradient-card border-border">
            <CardContent className="p-0">
              <button
                className="w-full p-4 flex items-center justify-between text-left"
                onClick={() => setExpandedId(expandedId === record.id ? null : record.id!)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    {getRoundIcon(record.roundType)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{record.roundType} Round</p>
                    <p className="text-xs text-muted-foreground">{formatDate(record.createdAt)} • {formatDuration(record.duration)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className={`font-bold text-lg ${getScoreColor(record.percentage)}`}>{record.percentage}%</p>
                    <p className="text-xs text-muted-foreground">{record.overallScore}/{record.maxScore}</p>
                  </div>
                  {expandedId === record.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>

              {expandedId === record.id && (
                <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <p className="text-sm text-foreground">{record.overallFeedback}</p>
                  </div>

                  {record.tips?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">💡 Tips</p>
                      <ul className="space-y-1">
                        {record.tips.map((tip, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span> {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground">Questions & Answers</p>
                    {record.questionResults.map((qr, i) => (
                      <div key={i} className="p-3 rounded-lg bg-secondary/20 border border-border space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-foreground">Q{i + 1}: {qr.question}</p>
                          <Badge className={`flex-shrink-0 ${
                            qr.score >= 7 ? 'bg-success/20 text-success' :
                            qr.score >= 4 ? 'bg-warning/20 text-warning' :
                            'bg-destructive/20 text-destructive'
                          }`}>{qr.score}/10</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground"><strong>A:</strong> {qr.answer || '(No answer)'}</p>
                        <p className="text-xs text-muted-foreground italic">{qr.feedback}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {records.length === 0 && (
          <div className="text-center py-12">
            <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Practice Sessions Yet</h3>
            <p className="text-muted-foreground mb-4">Start your first AI interview practice!</p>
            <Link to="/dashboard/practice-interview">
              <Button className="bg-gradient-primary">Start Practicing</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewHistory;
