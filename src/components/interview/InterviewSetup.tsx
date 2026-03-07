/**
 * Interview Setup Component
 * Handles interview type selection and configuration
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Monitor, Users, BookOpen, Layers, ArrowRight, Briefcase,
  Code, Cpu, Brain, Sparkles, ChevronRight, Zap
} from 'lucide-react';
import type { InterviewType, ExperienceLevel, Difficulty, InterviewConfig, TECH_STACK_OPTIONS, ROLE_OPTIONS } from '@/lib/geminiService';

interface InterviewSetupProps {
  onStart: (config: InterviewConfig) => void;
  isLoading?: boolean;
}

const INTERVIEW_TYPES: { type: InterviewType; icon: React.ReactNode; desc: string; color: string }[] = [
  { type: 'Technical', icon: <Code className="w-6 h-6" />, desc: 'DSA, algorithms, coding, system concepts', color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30' },
  { type: 'Behavioral', icon: <Users className="w-6 h-6" />, desc: 'Leadership, teamwork, STAR scenarios', color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30' },
  { type: 'System Design', icon: <Cpu className="w-6 h-6" />, desc: 'Architecture, scalability, trade-offs', color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30' },
  { type: 'Mixed', icon: <Layers className="w-6 h-6" />, desc: 'Technical + behavioral combined', color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30' },
];

const EXPERIENCE_LEVELS: ExperienceLevel[] = ['Fresher', '1-3 Years', '3+ Years'];
const DIFFICULTIES: Difficulty[] = ['Easy', 'Medium', 'Hard'];
const ROLES = ['Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Data Scientist', 'DevOps Engineer', 'Mobile Developer', 'QA Engineer'];
const TECH_STACKS = ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'Go', 'SQL', 'MongoDB', 'AWS', 'Docker', 'Data Structures', 'Algorithms', 'System Design', 'Machine Learning'];

const InterviewSetup: React.FC<InterviewSetupProps> = ({ onStart, isLoading }) => {
  const [step, setStep] = useState<'type' | 'config'>('type');
  const [selectedType, setSelectedType] = useState<InterviewType | null>(null);
  const [role, setRole] = useState('Software Engineer');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('Fresher');
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [selectedTech, setSelectedTech] = useState<string[]>(['JavaScript', 'React']);
  const [questionCount, setQuestionCount] = useState(5);

  const handleTypeSelect = (type: InterviewType) => {
    setSelectedType(type);
    setStep('config');
  };

  const toggleTech = (tech: string) => {
    setSelectedTech(prev =>
      prev.includes(tech) ? prev.filter(t => t !== tech) : [...prev, tech]
    );
  };

  const handleStart = () => {
    if (!selectedType) return;
    onStart({
      type: selectedType,
      role,
      techStack: selectedTech,
      experienceLevel,
      difficulty,
      questionCount,
    });
  };

  // Step 1: Interview Type Selection
  if (step === 'type') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto">
            <Brain className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Choose Interview Type</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Select the type of interview you want to practice. Each type focuses on different skills.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {INTERVIEW_TYPES.map(({ type, icon, desc, color }) => (
            <button
              key={type}
              onClick={() => handleTypeSelect(type)}
              className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${color} p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/5 to-transparent rounded-bl-full" />
              <div className="relative space-y-3">
                <div className="w-12 h-12 rounded-xl bg-card/80 border border-border flex items-center justify-center text-foreground">
                  {icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    {type}
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">{desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Step 2: Configuration
  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setStep('type')}>
          ← Back
        </Button>
        <div>
          <h2 className="text-xl font-bold text-foreground">Configure Your Interview</h2>
          <p className="text-sm text-muted-foreground">{selectedType} Interview</p>
        </div>
      </div>

      {/* Role */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Target Role</label>
        <div className="flex flex-wrap gap-2">
          {ROLES.map(r => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all border ${
                role === r
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/50'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Experience Level */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Experience Level</label>
        <div className="flex gap-2">
          {EXPERIENCE_LEVELS.map(level => (
            <button
              key={level}
              onClick={() => setExperienceLevel(level)}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                experienceLevel === level
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/50'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Difficulty</label>
        <div className="flex gap-2">
          {DIFFICULTIES.map(d => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                difficulty === d
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/50'
              }`}
            >
              {d === 'Easy' ? '🟢' : d === 'Medium' ? '🟡' : '🔴'} {d}
            </button>
          ))}
        </div>
      </div>

      {/* Tech Stack */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Tech Stack <span className="text-muted-foreground">(select relevant)</span></label>
        <div className="flex flex-wrap gap-2">
          {TECH_STACKS.map(tech => (
            <button
              key={tech}
              onClick={() => toggleTech(tech)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all border ${
                selectedTech.includes(tech)
                  ? 'bg-primary/20 text-primary border-primary/50'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
              }`}
            >
              {selectedTech.includes(tech) ? '✓ ' : ''}{tech}
            </button>
          ))}
        </div>
      </div>

      {/* Question Count */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Number of Questions</label>
        <div className="flex gap-2">
          {[3, 5, 7, 10].map(n => (
            <button
              key={n}
              onClick={() => setQuestionCount(n)}
              className={`w-14 h-10 rounded-lg text-sm font-medium transition-all border ${
                questionCount === n
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Start Button */}
      <Button
        size="lg"
        className="w-full bg-gradient-primary text-primary-foreground gap-2 h-14 text-base font-semibold rounded-xl shadow-lg"
        onClick={handleStart}
        disabled={isLoading || selectedTech.length === 0}
      >
        {isLoading ? (
          <>
            <Sparkles className="w-5 h-5 animate-pulse" />
            Preparing Interview...
          </>
        ) : (
          <>
            <Zap className="w-5 h-5" />
            Start AI Interview
          </>
        )}
      </Button>
    </div>
  );
};

export default InterviewSetup;
