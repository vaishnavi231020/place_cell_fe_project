/**
 * Vapi AI Voice Interview Service
 * Handles real-time voice conversations with AI interviewer
 */

import Vapi from '@vapi-ai/web';

const VAPI_WEB_TOKEN = 'bf9c2db4-7c81-4700-ba44-8253b4721395';
const VAPI_WORKFLOW_ID = 'ab274338-bac4-4283-8e8b-9ea26830aa67';
import questionsData from "@/data/interviewQuestions.json";
export interface VapiTranscriptMessage {
  role: 'assistant' | 'user';
  text: string;
  timestamp: number;
}

export interface VapiCallbacks {
  onCallStart?: () => void;
  onCallEnd?: () => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onTranscript?: (message: VapiTranscriptMessage) => void;
  onError?: (error: any) => void;
  onVolumeLevel?: (level: number) => void;
}

export class VapiService {
  private vapi: Vapi | null = null;
  private transcript: VapiTranscriptMessage[] = [];
  private callbacks: VapiCallbacks = {};
  private isActive = false;

  constructor() {
    try {
      this.vapi = new Vapi(VAPI_WEB_TOKEN);
      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to initialize Vapi:', error);
    }
  }

  private setupEventListeners() {
    if (!this.vapi) return;

    this.vapi.on('call-start', () => {
      console.log('Vapi call started');
      this.isActive = true;
      this.callbacks.onCallStart?.();
    });

    this.vapi.on('call-end', () => {
      console.log('Vapi call ended');
      this.isActive = false;
      this.callbacks.onCallEnd?.();
    });

    this.vapi.on('speech-start', () => {
      this.callbacks.onSpeechStart?.();
    });

    this.vapi.on('speech-end', () => {
      this.callbacks.onSpeechEnd?.();
    });

    this.vapi.on('volume-level', (level: number) => {
      this.callbacks.onVolumeLevel?.(level);
    });

    this.vapi.on('message', (message: any) => {
      if (message.type === 'transcript') {
        const transcriptMsg: VapiTranscriptMessage = {
          role: message.role === 'assistant' ? 'assistant' : 'user',
          text: message.transcript,
          timestamp: Date.now()
        };

        // Only add final transcripts
        if (message.transcriptType === 'final') {
          this.transcript.push(transcriptMsg);
          this.callbacks.onTranscript?.(transcriptMsg);
        }
      }
    });

    this.vapi.on('error', (error: any) => {
      console.error('Vapi error:', error);
      this.callbacks.onError?.(error);
    });
  }

  /**
   * Set event callbacks
   */
  setCallbacks(callbacks: VapiCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Start a voice interview call using the configured workflow
   */
  // async startCall(context?: {
  //   interviewType?: string;
  //   role?: string;
  //   techStack?: string[];
  //   experienceLevel?: string;
  //   questions?: string[];
  // }): Promise<void> {
  //   if (!this.vapi) {
  //     throw new Error('Vapi not initialized. Check your API token.');
  //   }

  //   this.transcript = [];

  //   try {
  //     // Build assistant config with interview context
  //     const systemPrompt = buildInterviewerPrompt(context);

  //     await this.vapi.start({
  //       model: {
  //         provider: 'google' as any,
  //         model: 'gemini-2.0-flash' as any,
  //         messages: [
  //           {
  //             role: 'system',
  //             content: systemPrompt
  //           }
  //         ],
  //         temperature: 0.7,
  //       },
  //       name: 'AI Technical Interviewer',
  //       voice: {
  //         provider: '11labs' as any,
  //         voiceId: 'chris' as any,
  //       },
  //       firstMessage: getFirstMessage(context?.interviewType),
  //       transcriber: {
  //         provider: 'deepgram' as any,
  //         model: 'nova-2' as any,
  //         language: 'en',
  //       },
  //     });
  //   } catch (error) {
  //     console.error('Failed to start Vapi call:', error);
  //     throw new Error('Failed to start voice interview. Please check your microphone permissions.');
  //   }
  // }

  async startCall(context?: {
    interviewType?: string;
    role?: string;
    techStack?: string[];
    experienceLevel?: string;
    questions?: string[];
  }): Promise<void> {

    if (!this.vapi) {
      throw new Error('Vapi not initialized. Check your API token.');
    }

    this.transcript = [];

    try {

      // 🔹 Load questions from JSON
      const type = context?.interviewType?.toLowerCase() || "technical";

      const jsonQuestions =
        type === "behavioral"
          ? questionsData.behavioral
          : questionsData.technical;

      const systemPrompt = buildInterviewerPrompt({
        ...context,
        questions: jsonQuestions
      });

      await this.vapi.start({
        model: {
          provider: "google" as any,
          model: "gemini-3-flash-preview" as any,
          messages: [
            {
              role: "system",
              content: systemPrompt
            }
          ],
          temperature: 0.7
        },

        name: "AI Technical Interviewer",

        voice: {
          provider: "11labs" as any,
          voiceId: "chris" as any
        },

        firstMessage:
          "Hello! I'm your AI interviewer. I will begin with a few initial questions before the interview.",

        transcriber: {
          provider: "deepgram" as any,
          model: "nova-2" as any,
          language: "en"
        }
      });

    } catch (error) {
      console.error("Failed to start Vapi call:", error);
      throw new Error(
        "Failed to start voice interview. Please check your microphone permissions."
      );
    }
  }

  /**
   * Stop the current call
   */
  stopCall() {
    if (this.vapi && this.isActive) {
      this.vapi.stop();
      this.isActive = false;
    }
  }

  /**
   * Get the full transcript
   */
  getTranscript(): VapiTranscriptMessage[] {
    return [...this.transcript];
  }

  /**
   * Get formatted transcript as string
   */
  getTranscriptText(): string {
    return this.transcript
      .map(m => `${m.role === 'assistant' ? 'Interviewer' : 'Candidate'}: ${m.text}`)
      .join('\n\n');
  }

  /**
   * Check if call is active
   */
  isCallActive(): boolean {
    return this.isActive;
  }

  /**
   * Toggle mute
   */
  toggleMute(): boolean {
    if (!this.vapi) return false;
    const isMuted = this.vapi.isMuted();
    this.vapi.setMuted(!isMuted);
    return !isMuted;
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.stopCall();
    this.transcript = [];
    this.callbacks = {};
  }
}

/**
 * Build interviewer system prompt based on interview context
 */
function buildInterviewerPrompt(context?: {
  interviewType?: string;
  role?: string;
  techStack?: string[];
  experienceLevel?: string;
  questions?: string[];
}): string {
  const type = context?.interviewType || 'Technical';
  const role = context?.role || 'Software Engineer';
  const stack = context?.techStack?.join(', ') || 'general programming';
  const level = context?.experienceLevel || 'Fresher';

  let prompt = `You are a senior ${type.toLowerCase()} interviewer at a top tech company. You are conducting a professional job interview for the role of ${role}.

INTERVIEW CONTEXT:
- Interview Type: ${type}
- Role: ${role}
- Technology Stack: ${stack}
- Experience Level: ${level}

INSTRUCTIONS:
1. Ask ONE question at a time and wait for the candidate's full response.
2. Ask 3 easy questions total, then conclude the interview.
3. Be professional, encouraging, but honest in your assessment.
4. Adapt difficulty based on the candidate's responses.
5. For technical questions, probe deeper if the candidate shows strong knowledge.
6. Keep your responses concise and conversational.
7. `;

  if (type === 'Technical') {
    prompt += `\n\nFocus on: Data structures, algorithms, system design, ${stack}, problem-solving, and coding concepts.`;
  } else if (type === 'Behavioral') {
    prompt += `\n\nFocus on: Leadership, teamwork, conflict resolution, time management, and situational judgment using the STAR method.`;
  } else if (type === 'System Design') {
    prompt += `\n\nFocus on: Architecture decisions, scalability, database design, API design, and trade-offs in system design.`;
  } else if (type === 'Mixed') {
    prompt += `\n\nMix technical, behavioral, and situational questions. Start with technical, then move to behavioral.`;
  }

  // if (context?.questions?.length) {
  //   prompt += `\n\nUse these questions (adapt them naturally):\n${context.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
  // }
  if (context?.questions?.length) {
    prompt += `

  IMPORTANT:
  Start the interview by asking the following predefined questions FIRST in the same order.

  ${context.questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}

  After completing these questions, continue with your own relevant interview questions.
  `;
  }

  prompt += `\n\nAfter asking all questions, say: "That concludes our interview. Thank you for your time. You'll receive detailed feedback shortly."`;

  return prompt;
}

/**
 * Get first message based on interview type
 */
function getFirstMessage(interviewType?: string): string {
  const type = interviewType || 'Technical';
  return `Hello! I'm your AI interviewer today. We'll be doing a ${type.toLowerCase()} interview. I'll ask you 5 questions, and you'll have time to think and respond to each one. Are you ready to begin?`;
}

/**
 * Check if Vapi is available
 */
export function isVapiAvailable(): boolean {
  return !!VAPI_WEB_TOKEN;
}
