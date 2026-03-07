/**
 * Interview Session Component
 * Active interview view with AI avatar, camera, and live transcript
 */

import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Brain, Mic, MicOff, Video, VideoOff, PhoneOff,
  Volume2, VolumeX, Clock, MessageSquare, Radio,
  Loader2
} from 'lucide-react';
import type { VapiTranscriptMessage } from '@/lib/vapiService';
import type { InterviewConfig } from '@/lib/geminiService';

interface InterviewSessionProps {
  config: InterviewConfig;
  isConnecting: boolean;
  isActive: boolean;
  aiSpeaking: boolean;
  userSpeaking: boolean;
  isMuted: boolean;
  volumeLevel: number;
  transcript: VapiTranscriptMessage[];
  userName: string;
  onEndCall: () => void;
  onToggleMute: () => void;
  elapsedSeconds: number;
  mode: 'vapi' | 'speech';
  // Speech mode props
  speechState?: 'asking' | 'listening' | 'evaluating' | 'feedback';
  currentQuestion?: string;
  currentQuestionIndex?: number;
  totalQuestions?: number;
  interimText?: string;
  currentFeedback?: { score: number; feedback: string } | null;
}

const InterviewSession: React.FC<InterviewSessionProps> = ({
  config,
  isConnecting,
  isActive,
  aiSpeaking,
  userSpeaking,
  isMuted,
  volumeLevel,
  transcript,
  userName,
  onEndCall,
  onToggleMute,
  elapsedSeconds,
  mode,
  speechState,
  currentQuestion,
  currentQuestionIndex = 0,
  totalQuestions = 5,
  interimText,
  currentFeedback,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Start camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraOn(true);
      } catch {
        setCameraOn(false);
      }
    };
    startCamera();
    return () => {
      cameraStream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, interimText]);

  const toggleCamera = () => {
    if (cameraOn && cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
      setCameraOn(false);
    } else {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
          setCameraStream(stream);
          if (videoRef.current) videoRef.current.srcObject = stream;
          setCameraOn(true);
        })
        .catch(() => setCameraOn(false));
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const getStatusText = () => {
    if (isConnecting) return 'Connecting to AI Interviewer...';
    if (mode === 'speech') {
      switch (speechState) {
        case 'asking': return 'AI Interviewer Speaking...';
        case 'listening': return 'Listening to your answer...';
        case 'evaluating': return 'Analyzing response...';
        case 'feedback': return 'Providing feedback...';
        default: return 'AI Interviewer';
      }
    }
    if (aiSpeaking) return 'AI Interviewer Speaking...';
    if (userSpeaking) return 'Listening to you...';
    return 'AI Interviewer Ready';
  };

  // Audio wave bars
  const waveBars = Array.from({ length: 5 }, (_, i) => {
    const baseHeight = aiSpeaking ? 6 + (volumeLevel * 20) + Math.random() * 14 : 4;
    return baseHeight;
  });

  return (
    <div className="animate-fade-in h-[calc(100vh-80px)] flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
            <Brain className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{config.type} Interview</p>
            <p className="text-xs text-muted-foreground">
              {config.role} · {config.difficulty}
              {mode === 'speech' && totalQuestions > 0 && ` · Q${Math.min(currentQuestionIndex + 1, totalQuestions)}/${totalQuestions}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isActive && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-medium text-red-400">LIVE</span>
            </div>
          )}
          <Badge variant="outline" className="text-xs">
            <Clock className="w-3 h-3 mr-1" />
            {formatTime(elapsedSeconds)}
          </Badge>
        </div>
      </div>

      {/* Main Split View */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden">
        {/* LEFT — AI INTERVIEWER */}
        <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-card via-card to-primary/5 border-r border-border relative">
          {isConnecting ? (
            <div className="text-center space-y-6">
              <div className="relative w-28 h-28 mx-auto">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                <div className="absolute inset-3 rounded-full bg-primary/10 animate-pulse" />
                <div className="absolute inset-0 rounded-full bg-card border-2 border-primary/30 flex items-center justify-center">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Setting Up Interview</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {mode === 'vapi' ? 'Connecting to AI voice interviewer...' : 'Generating questions with AI...'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6 w-full max-w-md">
              {/* Animated Avatar */}
              <div className="relative">
                {aiSpeaking && (
                  <>
                    <div className="absolute -inset-6 rounded-full border-2 border-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
                    <div className="absolute -inset-4 rounded-full border border-primary/30 animate-pulse" />
                  </>
                )}
                <div className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${
                  aiSpeaking
                    ? 'bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/30 scale-110'
                    : 'bg-gradient-to-br from-muted to-muted/60 border-2 border-border'
                }`}>
                  <Brain className={`w-10 h-10 transition-colors ${aiSpeaking ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                </div>
                {aiSpeaking && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-end gap-0.5">
                    {waveBars.map((h, i) => (
                      <div
                        key={i}
                        className="w-1 bg-primary rounded-full transition-all duration-150"
                        style={{ height: `${h}px`, animationDelay: `${i * 0.1}s` }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Status */}
              <p className={`text-sm font-medium transition-colors ${aiSpeaking ? 'text-primary' : 'text-muted-foreground'}`}>
                {getStatusText()}
              </p>

              {/* Current Question (speech mode) */}
              {mode === 'speech' && currentQuestion && (
                <div className="w-full bg-card/80 backdrop-blur-sm rounded-2xl border border-border p-6 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-primary">Q{currentQuestionIndex + 1}</span>
                    </div>
                    <p className="text-foreground leading-relaxed font-medium text-sm">{currentQuestion}</p>
                  </div>
                </div>
              )}

              {/* Evaluating indicator (speech mode) */}
              {mode === 'speech' && speechState === 'evaluating' && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span className="text-xs font-medium text-amber-400">Evaluating your answer...</span>
                </div>
              )}

              {/* Brief Feedback (speech mode) */}
              {mode === 'speech' && speechState === 'feedback' && currentFeedback && (
                <div className={`w-full rounded-xl border p-4 text-center ${
                  currentFeedback.score >= 7 ? 'bg-emerald-500/20 border-emerald-500/30' :
                  currentFeedback.score >= 4 ? 'bg-amber-500/20 border-amber-500/30' :
                  'bg-red-500/20 border-red-500/30'
                }`}>
                  <span className={`text-3xl font-black ${
                    currentFeedback.score >= 7 ? 'text-emerald-400' :
                    currentFeedback.score >= 4 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {currentFeedback.score}/10
                  </span>
                  <p className="text-sm text-muted-foreground mt-2">{currentFeedback.feedback}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT — USER CAMERA + TRANSCRIPT */}
        <div className="flex flex-col bg-background">
          {/* Camera Feed */}
          <div className="relative aspect-video bg-muted/30 border-b border-border overflow-hidden">
            {cameraOn ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <VideoOff className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Camera is off</p>
              </div>
            )}
            {userSpeaking && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/90 backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-xs text-white font-medium">Speaking</span>
              </div>
            )}
            {mode === 'speech' && speechState === 'listening' && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/20 backdrop-blur-sm border border-red-500/30">
                <Mic className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                <span className="text-xs text-red-400 font-medium">Listening</span>
              </div>
            )}
            <div className="absolute bottom-3 left-3 px-3 py-1 rounded-md bg-black/50 backdrop-blur-sm">
              <span className="text-xs text-white font-medium">{userName}</span>
            </div>
          </div>

          {/* Live Transcript */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-4 py-2 border-b border-border flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Transcript</span>
            </div>
            <ScrollArea className="flex-1 px-4 py-3">
              <div className="space-y-3">
                {transcript.map((item, i) => (
                  <div key={i} className={`flex gap-2 ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {item.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Brain className="w-3 h-3 text-primary" />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                      item.role === 'assistant'
                        ? 'bg-muted text-foreground'
                        : 'bg-primary text-primary-foreground'
                    }`}>
                      {item.text}
                    </div>
                  </div>
                ))}
                {interimText && (
                  <div className="flex gap-2 justify-end">
                    <div className="max-w-[80%] rounded-xl px-3 py-2 text-sm bg-primary/50 text-primary-foreground italic">
                      {interimText}...
                    </div>
                  </div>
                )}
                <div ref={transcriptEndRef} />
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center justify-center gap-4 px-4 py-4 border-t border-border bg-card/80 backdrop-blur-sm">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full h-12 w-12"
          onClick={onToggleMute}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full h-12 w-12"
          onClick={toggleCamera}
        >
          {cameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </Button>
        <Button
          size="lg"
          className="rounded-full h-14 px-8 bg-red-600 hover:bg-red-700 text-white gap-2 shadow-lg shadow-red-600/30"
          onClick={onEndCall}
        >
          <PhoneOff className="w-5 h-5" /> End Interview
        </Button>
      </div>
    </div>
  );
};

export default InterviewSession;
