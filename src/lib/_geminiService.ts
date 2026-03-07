/**
 * Google Gemini API Service
 * Generates interview questions and evaluates answers
 * Uses REST API directly to avoid SDK compatibility issues
 */

const API_KEY = 'AIzaSyAka1R0hl21x1vBavJ1VnCs3QYWJ070VRA';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';

export type InterviewRound = 'Technical' | 'HR' | 'Aptitude';

export interface GeneratedQuestion {
  question: string;
  expectedKeyPoints: string[];
}

export interface AnswerEvaluation {
  score: number; // 0-10
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export interface InterviewFeedback {
  overallScore: number;
  totalQuestions: number;
  roundType: InterviewRound;
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
}

/**
 * Call Gemini API via REST
 */
async function callGemini(prompt: string): Promise<string> {
  console.log('Gemini API key present:', !!API_KEY, 'length:', API_KEY?.length || 0);
  if (!API_KEY) {
    throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY secret.');
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
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
 * Generate interview questions for a specific round type
 */
export async function generateInterviewQuestions(
  round: InterviewRound,
  count: number = 5
): Promise<GeneratedQuestion[]> {
  const prompts: Record<InterviewRound, string> = {
    Technical: `Generate ${count} technical interview questions commonly asked in campus placements. 
    Focus on topics like data structures, algorithms, OOP concepts, DBMS, OS, networking, and programming fundamentals.
    Questions should be suitable for engineering students.`,
    HR: `Generate ${count} HR interview questions commonly asked in campus placements.
    Focus on behavioral questions, situational questions, questions about strengths/weaknesses, career goals, teamwork, and leadership.
    Questions should be suitable for fresh graduates.`,
    Aptitude: `Generate ${count} aptitude/logical reasoning interview questions commonly asked in campus placements.
    Focus on problem-solving, logical reasoning, analytical thinking, and quantitative aptitude.
    Questions should be verbal (not requiring pen-paper calculations) suitable for a voice interview.`
  };

  const prompt = `${prompts[round]}

  Return ONLY a valid JSON array with exactly ${count} objects in this format:
  [
    {
      "question": "the interview question here",
      "expectedKeyPoints": ["key point 1", "key point 2", "key point 3"]
    }
  ]
  
  Do not include any text before or after the JSON array. Only return the JSON.`;

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
  round: InterviewRound
): Promise<AnswerEvaluation> {
  const prompt = `You are an expert interviewer evaluating a candidate's answer in a ${round} interview round.

Question: "${question}"
Candidate's Answer: "${answer}"

Evaluate the answer and return ONLY a valid JSON object (no markdown, no extra text):
{
  "score": <number from 0 to 10>,
  "feedback": "<brief 1-2 sentence feedback>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<area to improve 1>", "<area to improve 2>"]
}

If the answer is empty, irrelevant, or just noise, give score 0-1. Be fair but constructive.`;

  try {
    const text = await callGemini(prompt);
    return extractJSON(text);
  } catch (error) {
    console.error('Error evaluating answer:', error);
    return {
      score: 0,
      feedback: 'Could not evaluate the answer.',
      strengths: [],
      improvements: ['Try to provide a clearer answer']
    };
  }
}

/**
 * Generate overall interview feedback
 */
export async function generateOverallFeedback(
  round: InterviewRound,
  results: { question: string; answer: string; score: number }[]
): Promise<{ overallFeedback: string; tips: string[] }> {
  const questionsAndAnswers = results
    .map((r, i) => `Q${i + 1}: ${r.question}\nA${i + 1}: ${r.answer}\nScore: ${r.score}/10`)
    .join('\n\n');

  const prompt = `You are an expert career counselor. A student just completed a practice ${round} interview. Here are their responses:

${questionsAndAnswers}

Average Score: ${(results.reduce((s, r) => s + r.score, 0) / results.length).toFixed(1)}/10

Provide overall feedback. Return ONLY a valid JSON object:
{
  "overallFeedback": "<2-3 sentences summarizing performance>",
  "tips": ["<tip 1>", "<tip 2>", "<tip 3>"]
}`;

  try {
    const text = await callGemini(prompt);
    return extractJSON(text);
  } catch (error) {
    console.error('Error generating overall feedback:', error);
    return {
      overallFeedback: 'Practice makes perfect! Keep working on your interview skills.',
      tips: ['Practice more frequently', 'Review fundamentals', 'Stay calm and confident']
    };
  }
}
