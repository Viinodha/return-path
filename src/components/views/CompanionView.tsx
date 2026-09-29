import React, { useState, useEffect, useRef } from 'react';
import { Send, ChevronRight, ChevronLeft, Sparkles, Database, Check, AlertCircle } from 'lucide-react';
import { MemoryStore } from '../../lib/data/store';
import { extractFactsFromText, ExtractedFact } from '../../lib/agents/discovery';
import { generateConsultantAdvice } from '../../lib/agents/consultant';
import { calculateCareerReadiness } from '../../lib/readiness';
import { SEEDED_ROLES } from '../../lib/data/seed';

interface CompanionViewProps {
  store: MemoryStore;
  onNavigateToTab?: (tab: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'companion' | 'user';
  text: string;
  timestamp: string;
  isStreaming?: boolean;
}

const DEFAULT_OPENER = `Hi, I'm your career companion. Before we build a path, I'd like to understand where you are right now, not just what's on a resume. Tell me at your own pace, and you can change anything I remember later.`;

export const CompanionView: React.FC<CompanionViewProps> = ({ store, onNavigateToTab }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // Try to load persisted chat
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('returnpath_chat_history');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [
      {
        id: 'msg_initial',
        sender: 'companion',
        text: DEFAULT_OPENER,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [activeProposal, setActiveProposal] = useState<{
    message: string;
    onAccept: () => void;
    onDecline: () => void;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const state = store.getState();
  const memories = state.memories;
  const skills = state.skills;
  const tools = state.tools;
  const profile = state.profile;

  // Persist chat history
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('returnpath_chat_history', JSON.stringify(messages));
      } catch {}
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    setInputText('');

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      // 1. Extract memory facts in parallel to update profile and skills
      const extracted = extractFactsFromText(
        text,
        profile,
        skills,
        tools,
        memories
      );

      for (const fact of extracted.extractedFacts) {
        if (fact.type === 'profile' && fact.key === 'target_role') {
          store.updateProfile({ targetRole: fact.value });
        } else if (fact.type === 'career_break') {
          store.updateProfile({ careerGapReason: fact.value });
          store.saveMemoryFact('career_break', 'Career Break', fact.value, 'chat', 0.9);
        } else if (fact.type === 'skill') {
          const res = store.saveSkill({
            name: fact.label,
            category: (fact.category as any) || 'technical',
            level: fact.level || 3,
            evidence: `Reported during career companion conversation`,
            source: 'chat',
            user_edited: false,
          });

          if (res.requiresConfirmation && res.message) {
            setActiveProposal({
              message: res.message,
              onAccept: () => {
                store.saveSkill({
                  name: fact.label,
                  category: (fact.category as any) || 'technical',
                  level: fact.level || 3,
                  evidence: `Confirmed update via chat`,
                  source: 'chat',
                  user_edited: true,
                });
                setActiveProposal(null);
              },
              onDecline: () => setActiveProposal(null),
            });
          }
        } else if (fact.type === 'tool') {
          store.saveTool(fact.label, 'Software', 'chat');
        } else {
          store.saveMemoryFact(fact.key, fact.label, fact.value, 'chat', fact.confidence);
        }
      }

      // 2. Call live Gemini API route for intelligent dynamic response
      let aiReplyText = '';
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            profile,
            skills,
            tools,
            history: newMessages.slice(-10),
          }),
        });
        if (response.ok) {
          const data = await response.json();
          if (data?.reply) {
            aiReplyText = data.reply;
          }
        }
      } catch (apiErr) {
        console.warn('API Chat request warning:', apiErr);
      }

      // If AI returned reply, use it; otherwise fallback to extracted reply text
      const finalReply = aiReplyText || extracted.replyText;

      // If user asked advice, also save structured advice item
      if (text.toLowerCase().includes('how do i') || text.toLowerCase().includes('advice') || text.toLowerCase().includes('should i') || text.toLowerCase().includes('explain my gap')) {
        const targetRoleObj = SEEDED_ROLES.find(r => r.roleName.toLowerCase() === profile.targetRole?.toLowerCase());
        const readiness = calculateCareerReadiness(targetRoleObj, skills, tools, state.learningMilestones, state.projects, state.certificates, state.interviews);
        const advice = generateConsultantAdvice(text, profile, readiness, skills);
        store.saveAdvice(advice);
      }

      const companionMsg: ChatMessage = {
        id: `comp_${Date.now()}`,
        sender: 'companion',
        text: finalReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, companionMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden relative bg-[#F5F6F7]">
      {/* Central Chat Column - Max width 720px as specified in Section 4 */}
      <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] max-w-[720px] mx-auto w-full px-4 py-4">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              {/* User message sits in #EBF5FF block per Section 4 */}
              {msg.sender === 'user' ? (
                <div className="max-w-[85%] bg-[#EBF5FF] text-[#1D2D3E] px-4 py-3 rounded-[6px] border border-[#0070F2]/20 text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.text}
                </div>
              ) : (
                /* AI messages are plain left-aligned text with no avatar bubble and no gradient per Section 4 */
                <div className="max-w-[95%] text-[#1D2D3E] py-2 text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.text}
                </div>
              )}
              <span className="text-[10px] text-[#556B82] mt-1 px-1 font-mono">
                {msg.timestamp}
              </span>
            </div>
          ))}

          {isTyping && (
            <div className="text-xs text-[#556B82] py-2 flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 bg-[#0070F2] rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-[#0070F2] rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-[#0070F2] rounded-full animate-bounce [animation-delay:0.4s]" />
              <span className="ml-1 font-display">Thinking...</span>
            </div>
          )}

          {/* Active Proposal banner for user_edited protection per Section 5 */}
          {activeProposal && (
            <div className="p-3 bg-white border border-[#E76500] rounded-[6px] shadow-sm my-2 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#E76500] flex-shrink-0 mt-0.5" />
                <span className="text-[#1D2D3E] leading-relaxed">
                  {activeProposal.message}
                </span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={activeProposal.onAccept}
                  className="px-3 py-1 bg-[#0070F2] hover:bg-[#0064D9] text-white rounded-[4px] font-semibold text-xs transition-colors"
                >
                  Yes, Update It
                </button>
                <button
                  onClick={activeProposal.onDecline}
                  className="px-3 py-1 bg-white border border-[#D5DADD] hover:bg-[#F5F6F7] text-[#1D2D3E] rounded-[4px] text-xs transition-colors"
                >
                  Keep My Previous Entry
                </button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Starters / Suggested Topics */}
        {messages.length <= 3 && (
          <div className="py-2 flex flex-wrap gap-1.5">
            <button
              onClick={() => handleSendMessage("I'm returning after an 18-month career break for caregiving and want to target a Data Analyst role.")}
              className="text-[11px] bg-white hover:bg-[#EBF5FF] border border-[#D5DADD] hover:border-[#0070F2] text-[#1D2D3E] px-2.5 py-1 rounded-[4px] transition-colors text-left"
            >
              "I'm returning after an 18-month break for caregiving & targeting Data Analyst."
            </button>
            <button
              onClick={() => handleSendMessage("I have strong prior experience with Excel and SQL, and I'm interested in Financial Analyst positions.")}
              className="text-[11px] bg-white hover:bg-[#EBF5FF] border border-[#D5DADD] hover:border-[#0070F2] text-[#1D2D3E] px-2.5 py-1 rounded-[4px] transition-colors text-left"
            >
              "I have prior experience in Excel & SQL, targeting Financial Analyst."
            </button>
            <button
              onClick={() => handleSendMessage("How should I best explain my career gap to prospective employers?")}
              className="text-[11px] bg-white hover:bg-[#EBF5FF] border border-[#D5DADD] hover:border-[#0070F2] text-[#1D2D3E] px-2.5 py-1 rounded-[4px] transition-colors text-left"
            >
              "How should I explain my career gap to employers?"
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="pt-2">
          <div className="bg-white border border-[#D5DADD] focus-within:border-[#0070F2] rounded-[4px] p-2 flex items-end gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors">
            <textarea
              rows={2}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tell me about your experience, goals, or career questions (Enter to send)..."
              className="flex-1 resize-none bg-transparent outline-none text-xs text-[#1D2D3E] placeholder-[#556B82] leading-relaxed"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isTyping}
              className="p-2 bg-[#0070F2] hover:bg-[#0064D9] disabled:bg-[#D5DADD] text-white rounded-[4px] transition-colors flex-shrink-0 cursor-pointer disabled:cursor-not-allowed"
              title="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[10px] text-[#556B82] mt-1 text-center">
            The AI recommends, and you decide. Everything remembered can be inspected and edited in Career Memory.
          </p>
        </div>
      </div>

      {/* Collapsible Right Panel: "What I've remembered" per Section 4 */}
      <div
        className={`border-l border-[#D5DADD] bg-white transition-all duration-200 flex flex-col h-[calc(100vh-3.5rem)] ${
          isRightPanelOpen ? 'w-[280px]' : 'w-9'
        }`}
      >
        {/* Toggle Header */}
        <div className="p-3 border-b border-[#EAEDEF] flex items-center justify-between bg-[#F5F6F7]/50 select-none">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <Database className="w-3.5 h-3.5 text-[#0070F2] flex-shrink-0" />
            {isRightPanelOpen && (
              <span className="text-xs font-bold font-display text-[#1D2D3E] truncate">
                What I've Remembered
              </span>
            )}
          </div>
          <button
            onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
            className="p-1 text-[#556B82] hover:text-[#1D2D3E] rounded transition-colors"
            title={isRightPanelOpen ? 'Collapse panel' : 'Expand panel'}
          >
            {isRightPanelOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Chips Content */}
        {isRightPanelOpen && (
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {/* Target Role Chip */}
            <div>
              <span className="section-label block mb-1">Target Goal</span>
              {profile.targetRole ? (
                <div className="p-2 bg-[#EBF5FF] border border-[#0070F2]/30 rounded-[4px] text-xs font-medium text-[#0070F2]">
                  {profile.targetRole}
                </div>
              ) : (
                <span className="text-xs text-[#556B82] italic">Not yet set. Mention a role in chat.</span>
              )}
            </div>

            {/* Career Break Context */}
            {profile.careerGapReason && (
              <div>
                <span className="section-label block mb-1">Career Break</span>
                <div className="p-2 bg-white border border-[#D5DADD] rounded-[4px] text-xs text-[#1D2D3E]">
                  {profile.careerGapReason}
                </div>
              </div>
            )}

            {/* Skills Extracted */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="section-label">Skills ({skills.length})</span>
                {skills.length > 0 && (
                  <button
                    onClick={() => onNavigateToTab?.('memory')}
                    className="text-[10px] text-[#0070F2] hover:underline"
                  >
                    View All
                  </button>
                )}
              </div>
              {skills.length === 0 ? (
                <span className="text-xs text-[#556B82] italic">No skills recorded yet.</span>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {skills.slice(0, 8).map(s => (
                    <span
                      key={s.id}
                      className="px-2 py-1 bg-[#F5F6F7] border border-[#D5DADD] rounded-[4px] text-[11px] text-[#1D2D3E] flex items-center gap-1"
                      title={`Level ${s.level}/5 · Source: ${s.source}`}
                    >
                      <span>{s.name}</span>
                      <strong className="text-[#0070F2] font-mono text-[10px]">{s.level}/5</strong>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Tools Extracted */}
            <div>
              <span className="section-label block mb-1">Tools ({tools.length})</span>
              {tools.length === 0 ? (
                <span className="text-xs text-[#556B82] italic">No tools recorded yet.</span>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {tools.map(t => (
                    <span
                      key={t.id}
                      className="px-2 py-0.5 bg-white border border-[#D5DADD] rounded-[4px] text-[11px] text-[#1D2D3E]"
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Stored Facts */}
            {memories.length > 0 && (
              <div>
                <span className="section-label block mb-1">Extracted Facts</span>
                <div className="space-y-1.5">
                  {memories.slice(0, 4).map(m => (
                    <div
                      key={m.id}
                      className="p-1.5 bg-[#F5F6F7] border border-[#EAEDEF] rounded-[4px] text-[11px]"
                    >
                      <span className="font-semibold text-[#1D2D3E] block">{m.label}</span>
                      <span className="text-[#556B82]">{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
