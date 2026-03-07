/**
 * Google Gemini API Service
 * Generates interview questions and evaluates answers
 * Uses REST API directly to avoid SDK compatibility issues
 */

const API_KEY = 'AIzaSyAoFx4f2aYc7uxaVOdlc9QBcABn1Si7HAo';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';

export type InterviewRound = 'Technical' | 'HR' | 'Aptitude';
export type InterviewType = 'Technical' | 'Behavioral' | 'System Design' | 'Mixed';
export type ExperienceLevel = 'Fresher' | '1-3 Years' | '3+ Years';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface InterviewConfig {
  type: InterviewType;
  role: string;
  techStack: string[];
  experienceLevel: ExperienceLevel;
  difficulty: Difficulty;
  questionCount: number;
}

export interface GeneratedQuestion {
  question: string;
  expectedKeyPoints: string[];
}

export interface AnswerEvaluation {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  suggestedAnswer?: string;
}

export interface DetailedFeedback {
  overallFeedback: string;
  tips: string[];
  communication: number;
  technicalKnowledge: number;
  confidence: number;
  finalVerdict: string;
}

export interface TranscriptEvaluation {
  score: number;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  communication: number;
  technicalKnowledge: number;
  confidence: number;
  finalVerdict: string;
  questionBreakdown: {
    question: string;
    answer: string;
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  }[];
}

/**
 * Call Gemini API via REST
 */
async function callGemini(prompt: string, maxTokens = 2048): Promise<string> {
  if (!API_KEY) {
    throw new Error('Gemini API key not configured.');
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: maxTokens,
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData?.error?.message || `API error: ${response.status}`;
    console.error('Gemini API error:', response.status, errorData);
    throw new Error(errorMessage);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('No response received from Gemini API');
  }

  return text.trim();
}

/**
 * Extract JSON from API response (handles markdown code blocks)
 */
function extractJSON(text: string): any {
  let jsonStr = text;
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }
  return JSON.parse(jsonStr);
}

/**
 * Generate interview questions based on config
 */
export async function generateInterviewQuestions(
  roundOrConfig: InterviewRound | InterviewConfig,
  count: number = 5
): Promise<GeneratedQuestion[]> {
  let prompt: string;

  if (typeof roundOrConfig === 'string') {
    // Legacy support for InterviewRound
    const prompts: Record<InterviewRound, string> = {
      Technical: `Generate ${count} technical interview questions for campus placements. Focus on data structures, algorithms, OOP, DBMS, OS, networking.`,
      HR: `Generate ${count} HR interview questions for campus placements. Focus on behavioral, situational, strengths/weaknesses, career goals, teamwork.`,
      Aptitude: `Generate ${count} aptitude/logical reasoning questions for campus placements. Focus on problem-solving, logical reasoning, analytical thinking.`
    };
    prompt = prompts[roundOrConfig];
  } else {
    // New config-based generation
    const config = roundOrConfig;
    prompt = `Generate ${config.questionCount} ${config.type} interview questions.

Context:
- Role: ${config.role}
- Tech Stack: ${config.techStack.join(', ')}
- Experience Level: ${config.experienceLevel}
- Difficulty: ${config.difficulty}

${config.type === 'Technical' ? 'Focus on coding, system design, data structures, algorithms, and tech-specific knowledge.' : ''}
${config.type === 'Behavioral' ? 'Focus on STAR method scenarios, leadership, teamwork, conflict resolution, and decision-making.' : ''}
${config.type === 'System Design' ? 'Focus on architecture, scalability, database design, API design, and trade-offs.' : ''}
${config.type === 'Mixed' ? 'Mix technical, behavioral, and situational questions. Start with technical then behavioral.' : ''}

Questions should match ${config.difficulty} difficulty for ${config.experienceLevel} level.`;
    count = config.questionCount;
  }

  prompt += `

Return ONLY a valid JSON array with exactly ${count} objects:
[{"question": "the question", "expectedKeyPoints": ["point 1", "point 2", "point 3"]}]

No text before or after the JSON.`;

  try {
    const text = await callGemini(prompt);
    const questions: GeneratedQuestion[] = extractJSON(text);
    return questions.slice(0, count);
  } catch (error) {
    console.error('Error generating questions:', error);
    throw new Error('Failed to generate interview questions. Please try again.');
  }
}

/**
 * Evaluate a single answer
 */
export async function evaluateAnswer(
  question: string,
  answer: string,
  round: InterviewRound | InterviewType
): Promise<AnswerEvaluation> {
  const prompt = `You are a senior interviewer evaluating a candidate's answer in a ${round} interview.

Question: "${question}"
Candidate's Answer: "${answer}"

Return ONLY valid JSON (no markdown):
{
  "score": <0-10>,
  "feedback": "<1-2 sentence feedback>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"],
  "suggestedAnswer": "<brief ideal answer>"
}

If empty/irrelevant answer, give score 0-1. Be fair but constructive.`;

  try {
    const text = await callGemini(prompt);
    return extractJSON(text);
  } catch (error) {
    console.error('Error evaluating answer:', error);
    return {
      score: 0,
      feedback: 'Could not evaluate the answer.',
      strengths: [],
      improvements: ['Try to provide a clearer answer'],
      suggestedAnswer: ''
    };
  }
}

/**
 * Evaluate a complete interview transcript from Vapi
 */
export async function evaluateTranscript(
  transcript: string,
  interviewType: string,
  role: string
): Promise<TranscriptEvaluation> {
  // Chunk long transcripts
  const chunks = chunkText(transcript, 3000);
  
  const prompt = `You are a senior technical interviewer and career counselor.
Evaluate this complete ${interviewType} interview transcript for the role of ${role}.

TRANSCRIPT:
${chunks.length > 1 ? chunks[0] + '\n...[continued]...\n' + chunks[chunks.length - 1] : transcript}

Analyze the conversation and return ONLY valid JSON:
{
  "score": <0-100 overall score>,
  "strengths": ["<strength>", ...],
  "weaknesses": ["<weakness>", ...],
  "improvements": ["<tip>", ...],
  "communication": <0-10>,
  "technicalKnowledge": <0-10>,
  "confidence": <0-10>,
  "finalVerdict": "<one sentence verdict>",
  "questionBreakdown": [
    {
      "question": "<the question asked>",
      "answer": "<candidate's answer summary>",
      "score": <0-10>,
      "feedback": "<brief feedback>",
      "strengths": ["<str>"],
      "improvements": ["<imp>"]
    }
  ]
}

Extract each Q&A pair from the transcript for questionBreakdown. Be thorough but fair.`;

  try {
    const text = await callGemini(prompt, 4096);
    return extractJSON(text);
  } catch (error) {
    console.error('Error evaluating transcript:', error);
    return {
      score: 0,
      strengths: [],
      weaknesses: ['Could not evaluate transcript'],
      improvements: ['Try again'],
      communication: 5,
      technicalKnowledge: 5,
      confidence: 5,
      finalVerdict: 'Evaluation failed. Please try again.',
      questionBreakdown: []
    };
  }
}

/**
 * Generate overall interview feedback
 */
export async function generateOverallFeedback(
  round: InterviewRound | InterviewType,
  results: { question: string; answer: string; score: number }[]
): Promise<DetailedFeedback> {
  const questionsAndAnswers = results
    .map((r, i) => `Q${i + 1}: ${r.question}\nA${i + 1}: ${r.answer}\nScore: ${r.score}/10`)
    .join('\n\n');

  const prompt = `You are a senior career counselor. A student completed a practice ${round} interview:

${questionsAndAnswers}

Average Score: ${(results.reduce((s, r) => s + r.score, 0) / results.length).toFixed(1)}/10

Return ONLY valid JSON:
{
  "overallFeedback": "<2-3 sentences>",
  "tips": ["<tip 1>", "<tip 2>", "<tip 3>"],
  "communication": <0-10>,
  "technicalKnowledge": <0-10>,
  "confidence": <0-10>,
  "finalVerdict": "<one sentence verdict>"
}`;

  try {
    const text = await callGemini(prompt);
    return extractJSON(text);
  } catch (error) {
    console.error('Error generating overall feedback:', error);
    return {
      overallFeedback: 'Practice makes perfect! Keep working on your interview skills.',
      tips: ['Practice more frequently', 'Review fundamentals', 'Stay calm and confident'],
      communication: 5,
      technicalKnowledge: 5,
      confidence: 5,
      finalVerdict: 'Keep practicing to improve your skills.'
    };
  }
}

/**
 * Chunk text for processing large transcripts
 */
function chunkText(text: string, maxChunkSize: number): string[] {
  if (text.length <= maxChunkSize) return [text];
  
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let current = '';

  for (const sentence of sentences) {
    if ((current + sentence).length > maxChunkSize && current) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += ' ' + sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

// Tech stack options for interview configuration
export const TECH_STACK_OPTIONS = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python',
  'Java', 'C++', 'Go', 'Rust', 'SQL', 'MongoDB',
  'AWS', 'Docker', 'Kubernetes', 'GraphQL', 'REST APIs',
  'Data Structures', 'Algorithms', 'System Design', 'Machine Learning'
] as const;

export const ROLE_OPTIONS = [
  'Software Engineer', 'Frontend Developer', 'Backend Developer',
  'Full Stack Developer', 'Data Scientist', 'DevOps Engineer',
  'Mobile Developer', 'QA Engineer', 'Product Manager'
] as const;
