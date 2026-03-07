/**
 * Speech Service - Web Speech API wrapper
 * Handles Text-to-Speech and Speech-to-Text with silence detection
 */

// Extend Window for webkit Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export class SpeechService {
  private synthesis: SpeechSynthesis;
  private recognition: any = null;
  private silenceTimer: ReturnType<typeof setTimeout> | null = null;
  private isListening = false;

  constructor() {
    this.synthesis = window.speechSynthesis;
  }

  /**
   * Speak text using Web Speech API
   * Returns a promise that resolves when speech is complete
   */
  speak(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Cancel any ongoing speech
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Try to get a good English voice
      const voices = this.synthesis.getVoices();
      const englishVoice = voices.find(v => 
        v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Microsoft') || v.name.includes('Natural'))
      ) || voices.find(v => v.lang.startsWith('en-US')) || voices.find(v => v.lang.startsWith('en'));
      
      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (e) => {
        console.error('Speech error:', e);
        resolve(); // Resolve anyway to not block the flow
      };

      this.synthesis.speak(utterance);
    });
  }

  /**
   * Start listening for speech with silence detection
   * Returns the recognized text
   */
  startListening(
    silenceDurationMs: number = 3000,
    onInterim?: (text: string) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognitionAPI) {
        reject(new Error('Speech recognition not supported in this browser'));
        return;
      }

      this.recognition = new SpeechRecognitionAPI();
      this.recognition.lang = 'en-US';
      this.recognition.interimResults = true;
      this.recognition.continuous = true;
      this.recognition.maxAlternatives = 1;

      let finalTranscript = '';
      let lastSpeechTime = Date.now();
      this.isListening = true;

      // Reset silence timer
      const resetSilenceTimer = () => {
        if (this.silenceTimer) clearTimeout(this.silenceTimer);
        lastSpeechTime = Date.now();
        
        this.silenceTimer = setTimeout(() => {
          // User has been silent for the specified duration
          if (this.isListening) {
            this.stopListening();
            resolve(finalTranscript.trim());
          }
        }, silenceDurationMs);
      };

      this.recognition.onresult = (event) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript = transcript;
          }
        }

        resetSilenceTimer();
        
        if (onInterim) {
          onInterim(finalTranscript + interimTranscript);
        }
      };

      this.recognition.onerror = (event) => {
        console.error('Recognition error:', event.error);
        if (event.error === 'no-speech') {
          // No speech detected, resolve with empty
          this.stopListening();
          resolve(finalTranscript.trim() || '');
        } else if (event.error !== 'aborted') {
          this.stopListening();
          resolve(finalTranscript.trim() || '');
        }
      };

      this.recognition.onend = () => {
        // If still supposed to be listening, restart
        if (this.isListening && finalTranscript.trim() === '') {
          try {
            this.recognition?.start();
          } catch {
            resolve('');
          }
        } else if (this.isListening) {
          this.isListening = false;
          resolve(finalTranscript.trim());
        }
      };

      try {
        this.recognition.start();
        // Start the initial silence timer (give user time to start speaking)
        this.silenceTimer = setTimeout(() => {
          if (finalTranscript.trim() === '' && this.isListening) {
            this.stopListening();
            resolve('');
          }
        }, silenceDurationMs + 5000); // Extra time for first response
      } catch (error) {
        console.error('Failed to start recognition:', error);
        reject(error);
      }
    });
  }

  /**
   * Stop listening
   */
  stopListening() {
    this.isListening = false;
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Already stopped
      }
      this.recognition = null;
    }
  }

  /**
   * Stop speaking
   */
  stopSpeaking() {
    this.synthesis.cancel();
  }

  /**
   * Clean up all resources
   */
  cleanup() {
    this.stopSpeaking();
    this.stopListening();
  }

  /**
   * Check if speech recognition is supported
   */
  static isSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  /**
   * Check if speech synthesis is supported
   */
  static isSynthesisSupported(): boolean {
    return !!window.speechSynthesis;
  }
}
