import React, { useState, useEffect, useRef } from 'react';
import {
  UserCheck,
  Send,
  Sparkles,
  Award,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FolderGit2,
  Plus,
  Check,
  Layers,
  RotateCcw,
  Mic,
  MicOff,
  Square,
  Volume2,
  Radio,
  Loader2,
  Trash2,
  Globe,
  Clock,
} from 'lucide-react';
import { MemoryStore } from '../../lib/data/store';
import {
  INTERVIEW_QUESTION_BANK,
  evaluateInterviewResponse,
  recommendProjectsForGaps,
  InterviewQuestionTemplate,
} from '../../lib/agents/coach';
import { InterviewSession, ProjectItem } from '../../lib/types';
import { SEEDED_ROLES } from '../../lib/data/seed';
import { ProgressBar } from '../common/ProgressBar';

interface InterviewViewProps {
  store: MemoryStore;
  onNavigateToTab?: (tab: string) => void;
}

export const InterviewView: React.FC<InterviewViewProps> = ({ store, onNavigateToTab }) => {
  const state = store.getState();
  const profile = state.profile;
  const skills = state.skills;
  const interviews = state.interviews;

  const [activeSection, setActiveSection] = useState<'interview' | 'projects'>('interview');
  const [selectedMode, setSelectedMode] = useState<InterviewSession['mode']>('resume-gap');

  // Interview Session State
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [currentFeedback, setCurrentFeedback] = useState<any | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Voice to Text State
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [speechLanguage, setSpeechLanguage] = useState<'en-IN' | 'en-US'>('en-IN');
  const [speechDuration, setSpeechDuration] = useState(0);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [isTranscribingAudio, setIsTranscribingAudio] = useState(false);
  const [isRecordingAudioFallback, setIsRecordingAudioFallback] = useState(false);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Filter questions for current mode
  const filteredQuestions = INTERVIEW_QUESTION_BANK.filter(
    q => q.mode === selectedMode || (selectedMode === 'resume-gap' && q.mode === 'resume-gap')
  );

  const currentQuestion: InterviewQuestionTemplate = filteredQuestions[activeQuestionIndex] || INTERVIEW_QUESTION_BANK[0];

  // Project Coach state
  const targetRoleObj = SEEDED_ROLES.find(
    r => r.roleName.toLowerCase() === profile.targetRole?.toLowerCase()
  );
  const recommendedProjects = recommendProjectsForGaps(targetRoleObj || null, skills);

  // Check Web Speech API availability
  const hasWebSpeech = typeof window !== 'undefined' && (
    'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  );

  // Stop recording timer when not listening
  useEffect(() => {
    if (isListening || isRecordingAudioFallback) {
      timerRef.current = setInterval(() => {
        setSpeechDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isListening, isRecordingAudioFallback]);

  // Clean up recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Web Speech API Voice-to-Text Handler
  const startLiveDictation = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Fallback to media recorder
      startMediaRecorderAudio();
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = speechLanguage;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechDuration(0);
        setVoiceNotice('Listening to your spoken response. Speak naturally into your microphone...');
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let finalChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalChunk += transcript + ' ';
          } else {
            currentInterim += transcript;
          }
        }

        if (finalChunk) {
          setUserAnswer(prev => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${finalChunk.trim()}` : finalChunk.trim();
          });
          setInterimTranscript('');
        } else {
          setInterimTranscript(currentInterim);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setVoiceNotice('Microphone permission was denied. Please allow microphone access in your browser settings.');
        } else if (event.error === 'no-speech') {
          // keep listening or prompt
        } else {
          setVoiceNotice(`Speech recognition notice: ${event.error}. You can also type or use AI audio transcription.`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('Could not start live dictation:', err);
      // fallback to audio recorder
      startMediaRecorderAudio();
    }
  };

  const stopLiveDictation = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
    setInterimTranscript('');
    setVoiceNotice('Voice input captured and converted to text.');
  };

  // MediaRecorder Fallback + Gemini AI Audio Transcription
  const startMediaRecorderAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(t => t.stop());

        // Convert blob to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Data = (reader.result as string).split(',')[1];
          await transcribeWithGemini(base64Data);
        };
      };

      mediaRecorder.start();
      setIsRecordingAudioFallback(true);
      setSpeechDuration(0);
      setVoiceNotice('Recording audio via microphone for Gemini AI transcription...');
    } catch (err: any) {
      setVoiceNotice('Could not access microphone. Please check browser permissions or type your response.');
    }
  };

  const stopMediaRecorderAudio = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecordingAudioFallback(false);
    }
  };

  const transcribeWithGemini = async (base64Audio: string) => {
    setIsTranscribingAudio(true);
    setVoiceNotice('Transcribing audio using Gemini AI transcription model...');
    try {
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioBase64: base64Audio, mimeType: 'audio/webm' }),
      });
      const data = await res.json();
      if (data.text) {
        setUserAnswer(prev => {
          const trimmed = prev.trim();
          return trimmed ? `${trimmed} ${data.text}` : data.text;
        });
        setVoiceNotice('Audio transcribed successfully into your answer box!');
      } else {
        setVoiceNotice('Transcription completed. You can edit or submit your answer.');
      }
    } catch (err: any) {
      setVoiceNotice('Transcription server temporarily busy. Please type your response.');
    } finally {
      setIsTranscribingAudio(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleEvaluate = () => {
    if (!userAnswer.trim()) return;

    // Stop listening if still on
    if (isListening) stopLiveDictation();
    if (isRecordingAudioFallback) stopMediaRecorderAudio();

    setIsEvaluating(true);
    setTimeout(() => {
      const evaluation = evaluateInterviewResponse(currentQuestion, userAnswer);
      setCurrentFeedback(evaluation);

      // Save to memory store
      const session: InterviewSession = {
        id: `int_${Date.now()}`,
        mode: selectedMode,
        roleName: profile.targetRole || 'Data Analyst',
        createdAt: new Date().toISOString(),
        overallScore: evaluation.overallScore,
        questions: [
          {
            question: currentQuestion.question,
            userAnswer,
            dimensionScores: evaluation.dimensionScores,
            feedback: evaluation.feedback,
            strengths: evaluation.strengths,
            improvements: evaluation.improvements,
            sampleResponse: evaluation.sampleModelAnswer,
          },
        ],
      };

      store.saveInterview(session);
      setIsEvaluating(false);
    }, 400);
  };

  const handleNextQuestion = () => {
    setUserAnswer('');
    setInterimTranscript('');
    setCurrentFeedback(null);
    setVoiceNotice(null);
    if (activeQuestionIndex < filteredQuestions.length - 1) {
      setActiveQuestionIndex(activeQuestionIndex + 1);
    } else {
      setActiveQuestionIndex(0);
    }
  };

  const handleAcceptProject = (project: ProjectItem) => {
    store.saveProject({
      ...project,
      status: 'in_progress',
      user_edited: true,
    });
  };

  return (
    <div className="flex-1 p-6 max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EAEDEF] gap-3">
        <div>
          <span className="section-label">Agent 3: Practice & Project Coach</span>
          <h2 className="text-xl font-bold font-display text-[#1D2D3E]">
            Mock Interviews & Portfolio Projects
          </h2>
          <p className="text-xs text-[#556B82] mt-0.5">
            Rehearse real interview scenarios with live voice-to-text dictation and build demonstrable portfolio artifacts for career re-entry.
          </p>
        </div>

        {/* Section switcher */}
        <div className="flex items-center gap-1 bg-[#F5F6F7] p-1 border border-[#D5DADD] rounded-[4px]">
          <button
            onClick={() => setActiveSection('interview')}
            className={`px-3 py-1.5 rounded-[4px] text-xs font-semibold font-display transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeSection === 'interview'
                ? 'bg-white text-[#0070F2] shadow-sm'
                : 'text-[#556B82] hover:text-[#1D2D3E]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Mock Interview</span>
          </button>
          <button
            onClick={() => setActiveSection('projects')}
            className={`px-3 py-1.5 rounded-[4px] text-xs font-semibold font-display transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeSection === 'projects'
                ? 'bg-white text-[#0070F2] shadow-sm'
                : 'text-[#556B82] hover:text-[#1D2D3E]'
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>Project Coach ({recommendedProjects.length})</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: MOCK INTERVIEW */}
      {activeSection === 'interview' && (
        <div className="space-y-6">
          {/* Mode Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'resume-gap', label: 'Career Break & Narrative', desc: 'Explaining gaps with confidence' },
              { id: 'technical', label: 'Technical Mastery', desc: 'SQL, modeling & diagnostics' },
              { id: 'behavioral', label: 'Behavioral & Culture', desc: 'Conflict & stakeholder relations' },
              { id: 'role-specific', label: 'Role-Specific Scenarios', desc: 'Real-world business dilemmas' },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => {
                  setSelectedMode(m.id as any);
                  setActiveQuestionIndex(0);
                  setCurrentFeedback(null);
                  setUserAnswer('');
                  setInterimTranscript('');
                  setVoiceNotice(null);
                }}
                className={`p-3 rounded-[6px] border text-left transition-all cursor-pointer ${
                  selectedMode === m.id
                    ? 'border-[#0070F2] bg-[#EBF5FF]'
                    : 'border-[#D5DADD] bg-white hover:border-[#556B82]'
                }`}
              >
                <span
                  className={`text-xs font-bold font-display block ${
                    selectedMode === m.id ? 'text-[#0070F2]' : 'text-[#1D2D3E]'
                  }`}
                >
                  {m.label}
                </span>
                <span className="text-[11px] text-[#556B82] mt-0.5 block">{m.desc}</span>
              </button>
            ))}
          </div>

          {/* Active Question Box */}
          <div className="bg-white border border-[#D5DADD] rounded-[6px] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="section-label text-[#0070F2]">
                Interview Prompt {activeQuestionIndex + 1} of {filteredQuestions.length || 1}
              </span>
              <span className="text-xs text-[#556B82] font-mono">
                Mode: {selectedMode.toUpperCase()}
              </span>
            </div>

            <h3 className="text-base font-bold font-display text-[#1D2D3E] leading-relaxed">
              "{currentQuestion.question}"
            </h3>

            <div className="p-3 bg-[#F5F6F7] border border-[#EAEDEF] rounded-[4px] text-xs text-[#556B82] flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-[#0070F2] flex-shrink-0 mt-0.5" />
              <span>
                <strong>Coach's Tip:</strong> {currentQuestion.contextTip}
              </span>
            </div>

            {/* Answer Input Area & Voice-to-Text Suite */}
            {!currentFeedback ? (
              <div className="space-y-3 pt-2">
                {/* Voice-to-Text Control Bar */}
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      {/* Live Speech Recognition Start / Stop Button */}
                      {!isListening && !isRecordingAudioFallback ? (
                        <button
                          onClick={startLiveDictation}
                          className="px-3.5 py-1.5 bg-[#0070F2] hover:bg-[#0064D9] text-white rounded-[4px] text-xs font-semibold font-display flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        >
                          <Mic className="w-3.5 h-3.5" />
                          <span>Speak Answer (Voice-to-Text)</span>
                        </button>
                      ) : (
                        <button
                          onClick={isListening ? stopLiveDictation : stopMediaRecorderAudio}
                          className="px-3.5 py-1.5 bg-[#D20A0A] hover:bg-[#b00808] text-white rounded-[4px] text-xs font-semibold font-display flex items-center gap-1.5 transition-all shadow-xs animate-pulse cursor-pointer"
                        >
                          <Square className="w-3 h-3 fill-current" />
                          <span>Stop Speaking ({formatSeconds(speechDuration)})</span>
                        </button>
                      )}

                      {/* Language Selector */}
                      <div className="flex items-center gap-1 text-[11px] text-[#556B82] bg-white border border-[#D5DADD] rounded-[4px] px-2 py-1">
                        <Globe className="w-3 h-3 text-[#556B82]" />
                        <select
                          value={speechLanguage}
                          onChange={e => setSpeechLanguage(e.target.value as any)}
                          className="bg-transparent outline-none cursor-pointer text-[#1D2D3E] font-medium"
                        >
                          <option value="en-IN">English (India) 🇮🇳</option>
                          <option value="en-US">English (US) 🇺🇸</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#556B82]">
                      {(isListening || isRecordingAudioFallback) && (
                        <div className="flex items-center gap-1.5 text-[#D20A0A] font-semibold">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#D20A0A] animate-ping" />
                          <span className="flex items-center gap-1">
                            <Radio className="w-3.5 h-3.5" />
                            Recording: {formatSeconds(speechDuration)}
                          </span>
                        </div>
                      )}

                      {userAnswer && (
                        <button
                          onClick={() => {
                            setUserAnswer('');
                            setInterimTranscript('');
                          }}
                          className="text-[11px] text-[#8996A2] hover:text-[#D20A0A] flex items-center gap-1 cursor-pointer"
                          title="Clear answer text"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Clear Text</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Active Voice Waveform & Speech Feedback Indicator */}
                  {(isListening || isRecordingAudioFallback) && (
                    <div className="flex items-center justify-between p-2.5 bg-white border border-[#0070F2]/30 rounded-[4px] text-xs text-[#1D2D3E] animate-in fade-in duration-150">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-[#0070F2] animate-bounce" />
                        <span className="font-semibold text-[#0070F2]">Listening to your voice...</span>
                        <span className="text-[#556B82] text-[11px]">
                          Speak your STAR answer. Target pace: 60-90 seconds.
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-1 h-3 bg-[#0070F2] animate-pulse rounded-full" />
                        <span className="w-1 h-5 bg-[#0070F2] animate-bounce rounded-full" />
                        <span className="w-1 h-4 bg-[#0070F2] animate-pulse rounded-full" />
                        <span className="w-1 h-2 bg-[#0070F2] animate-bounce rounded-full" />
                      </div>
                    </div>
                  )}

                  {/* Real-time Interim Live Transcript Display */}
                  {interimTranscript && (
                    <div className="p-2 bg-[#FFF8E6] border border-[#E76500]/30 rounded-[4px] text-xs text-[#1D2D3E] flex items-start gap-2">
                      <span className="text-[10px] font-bold text-[#E76500] uppercase pt-0.5">Live Voice:</span>
                      <span className="italic text-[#1D2D3E] font-medium leading-relaxed">
                        "{interimTranscript}"
                      </span>
                    </div>
                  )}

                  {/* Status / Instruction Notice */}
                  {voiceNotice && !isListening && (
                    <div className="text-[11px] text-[#556B82] flex items-center gap-1.5 pt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#188918]" />
                      <span>{voiceNotice}</span>
                    </div>
                  )}

                  {isTranscribingAudio && (
                    <div className="flex items-center gap-2 text-xs text-[#0070F2]">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Transcribing spoken response via Gemini AI audio model...</span>
                    </div>
                  )}
                </div>

                {/* Textarea for the Spoken / Typed Answer */}
                <div className="relative">
                  <textarea
                    rows={6}
                    value={userAnswer}
                    onChange={e => setUserAnswer(e.target.value)}
                    placeholder="Type or click 'Speak Answer' to speak your response... (Tip: Structure your response using Situation, Task, Action taken, Results, and your re-entry readiness!)"
                    className="w-full text-xs p-3.5 border border-[#D5DADD] rounded-[4px] outline-none focus:border-[#0070F2] leading-relaxed bg-white"
                  />
                  {isListening && (
                    <span className="absolute bottom-3 right-3 text-[10px] font-mono text-[#D20A0A] bg-[#FFF0F0] px-2 py-0.5 rounded border border-[#D20A0A]/20">
                      MIC ON
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-3 text-[11px] text-[#556B82]">
                    <span>
                      Word count: <strong>{userAnswer.trim().split(/\s+/).filter(Boolean).length}</strong> words
                    </span>
                    <span>•</span>
                    <span>
                      Est. speaking time: ~
                      {Math.ceil(userAnswer.trim().split(/\s+/).filter(Boolean).length / 2.5)}s
                    </span>
                  </div>

                  <button
                    onClick={handleEvaluate}
                    disabled={!userAnswer.trim() || isEvaluating}
                    className="px-5 py-2 bg-[#0070F2] hover:bg-[#0064D9] disabled:bg-[#D5DADD] text-white rounded-[4px] text-xs font-semibold font-display flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isEvaluating ? 'Evaluating...' : 'Submit Spoken Response for Evaluation'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Evaluation Feedback Screen */
              <div className="pt-4 border-t border-[#EAEDEF] space-y-5 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#EBF5FF] border border-[#0070F2]/30 rounded-[6px] gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#0070F2] block">
                      Session Evaluation
                    </span>
                    <h4 className="text-sm font-bold font-display text-[#1D2D3E]">
                      {currentFeedback.feedback}
                    </h4>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-2xl font-bold font-display text-[#0070F2]">
                      {currentFeedback.overallScore}
                    </span>
                    <span className="text-xs text-[#556B82]"> / 100</span>
                  </div>
                </div>

                {/* Dimension scores */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 bg-[#F5F6F7] rounded border border-[#EAEDEF]">
                    <span className="text-[#556B82] text-[10px] uppercase font-bold block">Clarity</span>
                    <span className="font-bold font-display text-sm">{currentFeedback.dimensionScores.clarity}%</span>
                  </div>
                  <div className="p-2.5 bg-[#F5F6F7] rounded border border-[#EAEDEF]">
                    <span className="text-[#556B82] text-[10px] uppercase font-bold block">Depth & Detail</span>
                    <span className="font-bold font-display text-sm">{currentFeedback.dimensionScores.depth}%</span>
                  </div>
                  <div className="p-2.5 bg-[#F5F6F7] rounded border border-[#EAEDEF]">
                    <span className="text-[#556B82] text-[10px] uppercase font-bold block">Relevance</span>
                    <span className="font-bold font-display text-sm">{currentFeedback.dimensionScores.relevance}%</span>
                  </div>
                  <div className="p-2.5 bg-[#F5F6F7] rounded border border-[#EAEDEF]">
                    <span className="text-[#556B82] text-[10px] uppercase font-bold block">Gap Narrative</span>
                    <span className="font-bold font-display text-sm">
                      {currentFeedback.dimensionScores.gapExplanation || 80}%
                    </span>
                  </div>
                </div>

                {/* Strengths & Improvements */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-white border border-[#188918]/30 rounded-[4px] space-y-1">
                    <span className="font-bold text-[#188918] flex items-center gap-1 font-display">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Observed Strengths
                    </span>
                    <ul className="list-disc list-inside text-[#1D2D3E] space-y-1">
                      {currentFeedback.strengths.map((s: string, idx: number) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-white border border-[#E76500]/30 rounded-[4px] space-y-1">
                    <span className="font-bold text-[#E76500] flex items-center gap-1 font-display">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Areas for Improvement
                    </span>
                    <ul className="list-disc list-inside text-[#1D2D3E] space-y-1">
                      {currentFeedback.improvements.map((imp: string, idx: number) => (
                        <li key={idx}>{imp}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Model Benchmark Answer */}
                <div className="p-4 bg-[#F5F6F7] rounded-[4px] border border-[#EAEDEF] space-y-2 text-xs">
                  <span className="text-[10px] uppercase font-bold text-[#0070F2] block">
                    Coach's Reference Model Response:
                  </span>
                  <p className="text-[#1D2D3E] leading-relaxed italic">
                    "{currentFeedback.sampleModelAnswer}"
                  </p>
                </div>

                {/* Next Question Button */}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      setCurrentFeedback(null);
                      setUserAnswer('');
                      setInterimTranscript('');
                      setVoiceNotice(null);
                    }}
                    className="px-3 py-1.5 bg-white border border-[#D5DADD] hover:bg-[#F5F6F7] text-[#1D2D3E] rounded-[4px] text-xs cursor-pointer"
                  >
                    Retry Question
                  </button>
                  <button
                    onClick={handleNextQuestion}
                    className="px-4 py-1.5 bg-[#0070F2] hover:bg-[#0064D9] text-white rounded-[4px] text-xs font-semibold font-display cursor-pointer"
                  >
                    Next Question →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: PROJECT COACH */}
      {activeSection === 'projects' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#D5DADD] rounded-[6px] p-4 text-xs text-[#556B82] leading-relaxed">
            When a candidate's profile lacks verified proof for a key role requirement, the Project Coach formulates concrete portfolio projects that directly close those gaps.
          </div>

          <div className="space-y-4">
            {recommendedProjects.map(proj => {
              const isAlreadyAdded = state.projects.some(p => p.title === proj.title);

              return (
                <div
                  key={proj.id}
                  className="bg-white border border-[#D5DADD] rounded-[6px] p-5 space-y-3 hover:border-[#0070F2] transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-[#EBF5FF] text-[#0070F2] rounded text-[10px] font-bold">
                          {proj.difficulty}
                        </span>
                        <span className="text-[11px] text-[#556B82]">
                          Skills: {proj.skillsDemonstrated.join(', ')}
                        </span>
                      </div>
                      <h4 className="text-base font-bold font-display text-[#1D2D3E]">
                        {proj.title}
                      </h4>
                    </div>

                    <button
                      onClick={() => handleAcceptProject(proj)}
                      disabled={isAlreadyAdded}
                      className={`px-3 py-1.5 rounded-[4px] text-xs font-semibold font-display transition-colors flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                        isAlreadyAdded
                          ? 'bg-[#188918]/10 text-[#188918] border border-[#188918]/30 cursor-default'
                          : 'bg-[#0070F2] hover:bg-[#0064D9] text-white'
                      }`}
                    >
                      {isAlreadyAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>In My Projects</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Accept to Projects</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                    <div className="p-3 bg-[#F5F6F7] rounded border border-[#EAEDEF]">
                      <strong className="text-[#1D2D3E] block mb-1">Problem Statement:</strong>
                      <p className="text-[#556B82] leading-relaxed">{proj.problemStatement}</p>
                    </div>
                    <div className="p-3 bg-[#F5F6F7] rounded border border-[#EAEDEF]">
                      <strong className="text-[#1D2D3E] block mb-1">Expected Deliverable:</strong>
                      <p className="text-[#556B82] leading-relaxed">{proj.expectedOutcome}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-xs pt-2 border-t border-[#EAEDEF] text-[#556B82]">
                    <span>Suggested Stack: <strong className="text-[#1D2D3E]">{proj.technologies.join(', ')}</strong></span>
                    <span className="text-[#0070F2] font-medium">{proj.portfolioValue}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
