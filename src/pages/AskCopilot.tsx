import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Sparkles,
  Trash2,
  User,
  MessageSquare,
  Users,
  Bug,
  FileText,
  TrendingUp,
  BrainCircuit,
  Search,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Database,
  ArrowRight,
  Copy,
  CheckSquare,
  Edit3,
  Save,
  History,
  Plus,
  Square,
  Loader2,
  Layers,
  FileCode,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Paperclip,
  X,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { Sidebar } from '../components/Sidebar';
import { TopNavbar } from '../components/TopNavbar';
import { ChatSessionSidebar } from '../components/ChatSessionSidebar';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useWorkspaces } from '../hooks/useWorkspaces';
import { chatService, ChatSessionListItem, RAGSource, MemoryCitation } from '../services/chatService';

export const AskCopilotPage: React.FC = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { workspaces } = useWorkspaces(user?.id);

  // Active Workspace State
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('default_workspace');

  // Set default workspace if available
  useEffect(() => {
    if (workspaces.length > 0 && selectedWorkspaceId === 'default_workspace') {
      setSelectedWorkspaceId(workspaces[0].id);
    }
  }, [workspaces]);

  // Session & Message State
  const [sessions, setSessions] = useState<ChatSessionListItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState<boolean>(true);

  const [messages, setMessages] = useState<Array<{
    id: string;
    sender: 'user' | 'copilot';
    text: string;
    timestamp: string;
    isStreaming?: boolean;
    statusText?: string;
    isEditing?: boolean;
    feedback?: 'like' | 'dislike' | null;
    sources?: RAGSource[];
    memories?: MemoryCitation[];
    showSourcesAccordion?: boolean;
    showMemoriesAccordion?: boolean;
  }>>([]);

  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<{ name: string; content: string } | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRating = (msgId: string, rating: 'like' | 'dislike') => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId) {
          const newFeedback = m.feedback === rating ? null : rating;
          if (newFeedback === 'like') {
            toast.success('Thank you for the positive feedback! 👍', {
              style: {
                background: isDark ? '#161B22' : '#ffffff',
                color: isDark ? '#F8FAFC' : '#0F172A',
                border: `1px solid ${isDark ? '#2D3748' : '#E2E8F0'}`,
              },
            });
          } else if (newFeedback === 'dislike') {
            toast.error('Feedback recorded. We will refine future responses.', {
              style: {
                background: isDark ? '#161B22' : '#ffffff',
                color: isDark ? '#F8FAFC' : '#0F172A',
                border: `1px solid ${isDark ? '#2D3748' : '#E2E8F0'}`,
              },
            });
          }
          return { ...m, feedback: newFeedback };
        }
        return m;
      })
    );
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size exceeds 2MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setAttachment({ name: file.name, content });
      toast.success(`Attached ${file.name} 📎`);
    };
    reader.onerror = () => {
      toast.error('Failed to read attached file');
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  // Auto scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    chatEndRef.current?.scrollIntoView({ behavior, block: 'end' });
  };

  useEffect(() => {
    if (isGenerating) {
      scrollToBottom('auto');
    } else {
      scrollToBottom('smooth');
    }
  }, [messages, isGenerating]);

  // Load chat sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const fetchedSessions = await chatService.listSessions();
      setSessions(fetchedSessions);

      if (fetchedSessions.length > 0) {
        const initialSessionId = fetchedSessions[0].id;
        setActiveSessionId(initialSessionId);
        await loadMessagesForSession(initialSessionId);
      } else {
        await handleCreateNewSession();
      }
    } catch (err) {
      console.warn('Failed to fetch chat sessions:', err);
      setMessages([
        {
          id: 'welcome',
          sender: 'copilot',
          text: 'Hello! I am your AI Product Copilot. Ask me anything about customer feedback, feature requests, or product metrics.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const loadMessagesForSession = async (sessionId: string) => {
    try {
      const dbMessages = await chatService.listMessages(sessionId);
      if (dbMessages && dbMessages.length > 0) {
        const mapped = dbMessages.map((m) => ({
          id: m.id,
          sender: (m.role === 'user' ? 'user' : 'copilot') as 'user' | 'copilot',
          text: m.content,
          timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));
        setMessages(mapped);
      } else {
        setMessages([
          {
            id: 'welcome',
            sender: 'copilot',
            text: 'Hello! I am your AI Product Copilot with RAG & Long-Term Memory. Ask me anything about customer feedback, feature requests, or product metrics.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err) {
      console.error(`Failed to load messages for session ${sessionId}:`, err);
    }
  };

  const handleSelectSession = async (sessionId: string) => {
    if (isGenerating) {
      handleStopGeneration();
    }
    setActiveSessionId(sessionId);
    await loadMessagesForSession(sessionId);
  };

  const handleCreateNewSession = async () => {
    if (isGenerating) {
      handleStopGeneration();
    }
    try {
      const newSession = await chatService.createSession(undefined, selectedWorkspaceId);
      setSessions((prev) => [
        {
          id: newSession.id,
          title: newSession.title,
          is_archived: false,
          created_at: newSession.created_at,
          updated_at: newSession.updated_at,
        },
        ...prev,
      ]);
      setActiveSessionId(newSession.id);
      setMessages([
        {
          id: 'welcome',
          sender: 'copilot',
          text: 'New conversation started! Ask me anything about your product, users, or roadmap.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      console.error('Failed to create session:', err);
      toast.error('Could not create new session');
    }
  };

  const handleDeleteSession = async (sessionId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    const previousSessions = [...sessions];
    const remaining = sessions.filter((s) => s.id !== sessionId);

    // Optimistically update sessions list
    setSessions(remaining);

    if (activeSessionId === sessionId) {
      if (remaining.length > 0) {
        setActiveSessionId(remaining[0].id);
        loadMessagesForSession(remaining[0].id);
      } else {
        handleCreateNewSession();
      }
    }

    try {
      await chatService.deleteSession(sessionId);
      toast.success('Session deleted');
    } catch (err) {
      console.error('Failed to delete session:', err);
      // Revert if API call fails
      setSessions(previousSessions);
      toast.error('Failed to delete session on server');
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  };

  const toggleSourcesAccordion = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, showSourcesAccordion: !m.showSourcesAccordion } : m))
    );
  };

  const toggleMemoriesAccordion = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, showMemoriesAccordion: !m.showMemoriesAccordion } : m))
    );
  };

  const handleSend = async (queryText?: string) => {
    const rawQuery = (queryText || inputText).trim();
    if (!rawQuery || isGenerating) return;

    let promptPayload = rawQuery;
    let displayText = rawQuery;

    if (attachment && !queryText) {
      promptPayload = `${rawQuery}\n\n--- ATTACHED FILE CONTEXT (${attachment.name}) ---\n${attachment.content}\n--------------------------------------------------`;
      displayText = `${rawQuery}\n\n📎 *[Attached: ${attachment.name}]*`;
      setAttachment(null);
    }

    if (!queryText) {
      setInputText('');
    }

    let currentSessionId = activeSessionId;

    if (!currentSessionId) {
      try {
        const newSession = await chatService.createSession(rawQuery.slice(0, 50), selectedWorkspaceId);
        currentSessionId = newSession.id;
        setActiveSessionId(newSession.id);
        setSessions((prev) => [
          {
            id: newSession.id,
            title: newSession.title,
            is_archived: false,
            created_at: newSession.created_at,
            updated_at: newSession.updated_at,
          },
          ...prev,
        ]);
      } catch (err) {
        console.error('Failed to create session for query:', err);
      }
    } else {
      const activeSession = sessions.find((s) => s.id === currentSessionId);
      if (activeSession && (!activeSession.title || activeSession.title === 'Untitled Conversation')) {
        const autoTitle = rawQuery.length > 45 ? rawQuery.slice(0, 45) + '...' : rawQuery;
        chatService.updateSession(currentSessionId, { title: autoTitle }).catch(() => {});
        setSessions((prev) =>
          prev.map((s) => (s.id === currentSessionId ? { ...s, title: autoTitle } : s))
        );
      }
    }

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsgId = `user-${Date.now()}`;
    const copilotMsgId = `copilot-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, sender: 'user', text: displayText, timestamp },
    ]);

    if (currentSessionId) {
      chatService.createMessage(currentSessionId, displayText, 'user').catch((e) => {
        console.warn('Failed to persist user message:', e);
      });
    }

    setMessages((prev) => [
      ...prev,
      {
        id: copilotMsgId,
        sender: 'copilot',
        text: '',
        timestamp,
        isStreaming: true,
        statusText: 'Querying Qdrant Vector & User Long-Term Memory...',
      },
    ]);

    setIsGenerating(true);
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      let accumulatedText = '';

      await chatService.streamCopilot({
        prompt: promptPayload,
        sessionId: currentSessionId || undefined,
        workspaceId: selectedWorkspaceId,
        onChunk: (chunkText: string) => {
          accumulatedText += chunkText;
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id === copilotMsgId) {
                return {
                  ...msg,
                  text: accumulatedText,
                  statusText: undefined,
                };
              }
              return msg;
            })
          );
        },
        onMetadata: ({ sources, memories }) => {
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id === copilotMsgId) {
                return {
                  ...msg,
                  sources,
                  memories,
                };
              }
              return msg;
            })
          );
        },
        onStatus: (statusText: string) => {
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id === copilotMsgId) {
                return { ...msg, statusText };
              }
              return msg;
            })
          );
        },
        signal: abortController.signal,
      });

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === copilotMsgId) {
            return { ...msg, text: accumulatedText, isStreaming: false, statusText: undefined };
          }
          return msg;
        })
      );

      if (currentSessionId && accumulatedText.trim()) {
        await chatService.createMessage(currentSessionId, accumulatedText, 'assistant').catch((e) => {
          console.warn('Failed to persist copilot message:', e);
        });
      }
    } catch (err) {
      console.error('Failed to stream AI response:', err);
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === copilotMsgId) {
            return {
              ...msg,
              text: 'I apologize, but I encountered an error connecting to the AI subsystem.',
              isStreaming: false,
              statusText: undefined,
            };
          }
          return msg;
        })
      );
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleClearChat = async () => {
    if (isGenerating) {
      handleStopGeneration();
    }
    if (activeSessionId) {
      try {
        await chatService.deleteSession(activeSessionId);
        setSessions((prev) => prev.filter((s) => s.id !== activeSessionId));
        toast.success('Chat history cleared');
      } catch (err) {
        console.error('Failed to clear chat:', err);
      }
    }
    await handleCreateNewSession();
  };

  const handleRegenerate = async (copilotMsgId: string) => {
    if (isGenerating) return;
    // Find index of copilot message to regenerate
    const idx = messages.findIndex((m) => m.id === copilotMsgId);
    if (idx === -1) return;

    // Find preceding user query
    let userQueryText = '';
    for (let i = idx - 1; i >= 0; i--) {
      if (messages[i].sender === 'user') {
        userQueryText = messages[i].text;
        break;
      }
    }

    if (!userQueryText) return;

    // Remove the old copilot message and re-run handleSend
    setMessages((prev) => prev.filter((m) => m.id !== copilotMsgId));
    handleSend(userQueryText);
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard! 📋', {
      style: {
        background: isDark ? '#161B22' : '#ffffff',
        color: isDark ? '#F8FAFC' : '#0F172A',
        border: `1px solid ${isDark ? '#2D3748' : '#E2E8F0'}`,
      },
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleEditMessage = (id: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          return { ...m, isEditing: !m.isEditing };
        }
        return m;
      })
    );
  };

  const updateMessageText = (id: string, newText: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          return { ...m, text: newText };
        }
        return m;
      })
    );
  };

  const cardBg = isDark
    ? 'bg-[#161B22]/90 border-[#2D3748] shadow-lg shadow-black/20'
    : 'bg-white border-[#E2E8F0] shadow-sm hover:shadow-md';

  const sectionBg = isDark ? 'bg-[#0D1117]/50 border-[#2D3748]' : 'bg-[#F8FAFC] border-[#E2E8F0]';
  const inputBg = isDark ? 'bg-[#0D1117] border-[#2D3748]' : 'bg-white border-[#E2E8F0]';
  const userBubbleBg = isDark ? 'bg-[#2E1065]/30 border-[#4C1D95]/50' : 'bg-[#F3E8FF] border-[#E9D5FF]';
  const aiBubbleBg = isDark ? 'bg-[#161B22]/90 border-[#2D3748]' : 'bg-white border-[#E2E8F0]';

  return (
    <div className="min-h-screen transition-colors duration-200" style={{ backgroundColor: 'var(--bg-base)' }}>
      <Toaster position="top-right" />
      <Sidebar />
      <div className="ml-60 min-h-screen flex flex-col">
        <TopNavbar />
        <main className="flex-1 pt-20 px-8 pb-12 w-full max-w-screen-2xl mx-auto h-[calc(100vh)] flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6 shrink-0">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsHistoryOpen((prev) => !prev)}
                className={`p-2 rounded-xl border flex items-center gap-2 text-sm font-medium transition-all cursor-pointer ${
                  isHistoryOpen
                    ? 'bg-[#8B5CF6]/15 border-[#8B5CF6]/40 text-[#8B5CF6]'
                    : isDark
                    ? 'border-[#2D3748] text-[#CBD5E1] bg-[#1E293B]'
                    : 'border-[#E2E8F0] text-[#475569] bg-white'
                }`}
                title={isHistoryOpen ? 'Hide History Panel' : 'Show History Panel'}
              >
                <History className="w-5 h-5" />
              </button>
              <div>
                <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                  Ask Copilot — <span className={`text-[#94A3B8] font-normal`}>Module 9 •</span> <span className="text-[#10B981]">RAG & Memory Live</span>
                </h1>
                <p className={`text-sm text-[#94A3B8]`}>
                  (Live Feedback Index + Long-Term Memory Activated)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Workspace Scoping Selector */}
              {workspaces.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#94A3B8] font-medium hidden sm:inline">Workspace:</span>
                  <select
                    value={selectedWorkspaceId}
                    onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold outline-none transition-colors ${
                      isDark
                        ? 'bg-[#1E293B] border-[#2D3748] text-white focus:border-[#8B5CF6]'
                        : 'bg-white border-slate-200 text-slate-800 focus:border-purple-500'
                    }`}
                  >
                    <option value="default_workspace">Default Workspace</option>
                    {workspaces.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.workspaceName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={handleCreateNewSession}
                className="px-4 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white flex items-center gap-2 text-sm font-medium transition-colors cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                New Chat
              </button>

              <button
                onClick={handleClearChat}
                className={`px-4 py-2 rounded-xl border flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-colors cursor-pointer ${
                  isDark ? 'border-[#2D3748] text-[#CBD5E1] bg-[#1E293B]' : 'border-[#E2E8F0] text-[#475569] bg-white'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                Clear Chat
              </button>
            </div>
          </div>

          <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
            
            {/* Slide-in History Sidebar */}
            <ChatSessionSidebar
              isOpen={isHistoryOpen}
              onClose={() => setIsHistoryOpen(false)}
              sessions={sessions}
              activeSessionId={activeSessionId}
              onSelectSession={handleSelectSession}
              onCreateSession={handleCreateNewSession}
              onDeleteSession={handleDeleteSession}
              isLoading={isLoadingSessions}
            />

            {/* Chat Column */}
            <div className="flex-1 flex flex-col h-full gap-4 relative min-w-0">
              <div className="flex-1 overflow-y-auto pr-2 space-y-6 pb-24 scrollbar-hide">
                
                {messages.map((msg) => {
                  if (msg.sender === 'user') {
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-end gap-4"
                      >
                        <div className={`p-4 rounded-2xl rounded-tr-sm border max-w-[80%] ${userBubbleBg}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs font-semibold ${isDark ? 'text-[#CBD5E1]' : 'text-slate-700'}`}>You</span>
                            <span className="text-xs text-[#64748B]">• {msg.timestamp}</span>
                          </div>
                          <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'} leading-relaxed`}>
                            {msg.text}
                          </p>
                        </div>
                        <div className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 ${
                          isDark ? 'bg-[#1E293B] border-[#2D3748]' : 'bg-slate-100 border-slate-200'
                        }`}>
                          <User className="w-5 h-5 text-[#94A3B8]" />
                        </div>
                      </motion.div>
                    );
                  } else {
                    const hasSources = msg.sources && msg.sources.length > 0;
                    const hasMemories = msg.memories && msg.memories.length > 0;

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-4"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[#2E1065]/50 border border-[#4C1D95]/50 flex items-center justify-center shrink-0">
                          <Sparkles className="w-5 h-5 text-[#8B5CF6]" />
                        </div>
                        <div className={`p-6 rounded-2xl rounded-tl-sm border w-full max-w-[90%] ${aiBubbleBg}`}>
                          
                          {/* Message Header with Copy & Edit Buttons */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Copilot</span>
                              <span className="text-xs text-[#64748B]">• {msg.timestamp}</span>
                            </div>

                            {msg.text && !msg.isStreaming && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => toggleEditMessage(msg.id)}
                                  className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                                    msg.isEditing
                                      ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/40'
                                      : isDark ? 'border-[#2D3748] text-[#94A3B8] hover:text-white hover:bg-[#1E293B]' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                                  }`}
                                  title={msg.isEditing ? 'Save & Preview' : 'Edit response manually'}
                                >
                                  {msg.isEditing ? <Save className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                                </button>

                                <button
                                  onClick={() => handleCopyMessage(msg.id, msg.text)}
                                  className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                                    isDark ? 'border-[#2D3748] text-[#94A3B8] hover:text-white hover:bg-[#1E293B]' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                                  }`}
                                  title="Copy message"
                                >
                                  {copiedId === msg.id ? <CheckSquare className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>

                                <button
                                  onClick={() => handleRegenerate(msg.id)}
                                  disabled={isGenerating}
                                  className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer disabled:opacity-40 ${
                                    isDark ? 'border-[#2D3748] text-[#94A3B8] hover:text-white hover:bg-[#1E293B]' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                                  }`}
                                  title="Regenerate response"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => handleRating(msg.id, 'like')}
                                  className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                                    msg.feedback === 'like'
                                      ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/40'
                                      : isDark ? 'border-[#2D3748] text-[#94A3B8] hover:text-white hover:bg-[#1E293B]' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                                  }`}
                                  title="Good response"
                                >
                                  <ThumbsUp className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => handleRating(msg.id, 'dislike')}
                                  className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                                    msg.feedback === 'dislike'
                                      ? 'bg-rose-500/20 text-rose-500 border-rose-500/40'
                                      : isDark ? 'border-[#2D3748] text-[#94A3B8] hover:text-white hover:bg-[#1E293B]' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                                  }`}
                                  title="Poor response"
                                >
                                  <ThumbsDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                          
                          {msg.statusText && (
                            <p className="text-xs text-[#8B5CF6] italic animate-pulse mb-2 flex items-center gap-2">
                              <Loader2 className="w-3 h-3 animate-spin text-[#8B5CF6]" />
                              {msg.statusText}
                            </p>
                          )}

                          {msg.text ? (
                            msg.isEditing ? (
                              <div className="space-y-2">
                                <textarea
                                  value={msg.text}
                                  onChange={(e) => updateMessageText(msg.id, e.target.value)}
                                  rows={8}
                                  className={`w-full p-3 rounded-xl border font-mono text-xs leading-relaxed outline-none resize-y ${
                                    isDark
                                      ? 'bg-[#0D1117] border-[#2D3748] text-[#CBD5E1] focus:border-[#8B5CF6]'
                                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-purple-500'
                                  }`}
                                />
                                <div className="flex justify-end">
                                  <button
                                    onClick={() => toggleEditMessage(msg.id)}
                                    className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#8B5CF6] text-white hover:opacity-90 transition-opacity cursor-pointer"
                                  >
                                    Save & View
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className={`text-sm ${isDark ? 'text-[#CBD5E1]' : 'text-slate-700'} space-y-3 leading-relaxed`}>
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    h1: ({ node, ...props }) => (
                                      <h1 className={`text-xl font-bold mt-6 mb-3 border-b pb-2 ${
                                        isDark ? 'text-white border-[#2D3748]' : 'text-gray-900 border-slate-200'
                                      }`} {...props} />
                                    ),
                                    h2: ({ node, ...props }) => (
                                      <h2 className={`text-lg font-bold mt-5 mb-2.5 ${
                                        isDark ? 'text-white' : 'text-gray-900'
                                      }`} {...props} />
                                    ),
                                    h3: ({ node, ...props }) => (
                                      <h3 className={`text-base font-bold text-[#38BDF8] mt-4 mb-2`} {...props} />
                                    ),
                                    p: ({ node, ...props }) => (
                                      <p className={`mb-4 leading-relaxed text-sm font-normal last:mb-0 ${
                                        isDark ? 'text-[#CBD5E1]' : 'text-slate-800'
                                      }`} {...props} />
                                    ),
                                    strong: ({ node, ...props }) => (
                                      <strong className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`} {...props} />
                                    ),
                                    ul: ({ node, ...props }) => (
                                      <ul className={`list-disc pl-6 mb-4 space-y-1.5 text-sm ${
                                        isDark ? 'text-[#CBD5E1]' : 'text-slate-800'
                                      }`} {...props} />
                                    ),
                                    ol: ({ node, ...props }) => (
                                      <ol className={`list-decimal pl-6 mb-4 space-y-1.5 text-sm ${
                                        isDark ? 'text-[#CBD5E1]' : 'text-slate-800'
                                      }`} {...props} />
                                    ),
                                    li: ({ node, ...props }) => (
                                      <li className={`leading-relaxed ${isDark ? 'text-[#CBD5E1]' : 'text-slate-800'}`} {...props} />
                                    ),
                                    code: ({ node, ...props }) => (
                                      <code className={`px-1.5 py-0.5 rounded text-xs font-mono border ${
                                        isDark ? 'bg-[#1E293B] text-[#38BDF8] border-[#38BDF8]/20' : 'bg-slate-100 text-blue-700 border-blue-200'
                                      }`} {...props} />
                                    ),
                                    pre: ({ node, ...props }) => (
                                      <pre className={`p-4 rounded-xl overflow-x-auto my-4 text-xs font-mono shadow-inner border ${
                                        isDark ? 'bg-[#0D1117] border-[#2D3748] text-[#E2E8F0]' : 'bg-slate-900 border-slate-800 text-slate-100'
                                      }`} {...props} />
                                    ),
                                    table: ({ node, ...props }) => (
                                      <div className={`overflow-x-auto my-4 border rounded-xl shadow-md ${
                                        isDark ? 'border-[#2D3748]' : 'border-slate-200'
                                      }`}>
                                        <table className="min-w-full text-left border-collapse text-xs" {...props} />
                                      </div>
                                    ),
                                    thead: ({ node, ...props }) => (
                                      <thead className={`font-bold border-b ${
                                        isDark ? 'bg-[#1E293B] text-white border-[#2D3748]' : 'bg-slate-100 text-slate-900 border-slate-200'
                                      }`} {...props} />
                                    ),
                                    tbody: ({ node, ...props }) => (
                                      <tbody className={`divide-y ${
                                        isDark ? 'divide-[#2D3748]/60 bg-[#161B22]/60' : 'divide-slate-200 bg-white'
                                      }`} {...props} />
                                    ),
                                    th: ({ node, ...props }) => (
                                      <th className={`px-4 py-2.5 font-bold tracking-wider border-b ${
                                        isDark ? 'text-[#F8FAFC] border-[#2D3748]' : 'text-slate-900 border-slate-200'
                                      }`} {...props} />
                                    ),
                                    td: ({ node, ...props }) => (
                                      <td className={`px-4 py-2.5 leading-relaxed border-b ${
                                        isDark ? 'text-[#CBD5E1] border-[#2D3748]/50' : 'text-slate-800 border-slate-200'
                                      }`} {...props} />
                                    ),
                                    blockquote: ({ node, ...props }) => (
                                      <blockquote className={`my-4 p-4 rounded-xl border-l-4 border-[#8B5CF6] text-sm font-medium shadow-sm ${
                                        isDark ? 'bg-[#1E293B]/60 text-[#F1F5F9]' : 'bg-purple-50 text-purple-900'
                                      }`} {...props} />
                                    ),
                                  }}
                                >
                                  {msg.text}
                                </ReactMarkdown>
                              </div>
                            )
                          ) : (
                            <p className={`text-sm ${isDark ? 'text-[#CBD5E1]' : 'text-slate-700'} leading-relaxed`}>
                              {msg.isStreaming && !msg.statusText ? 'Thinking...' : ''}
                            </p>
                          )}

                          {/* P1 RAG Citations Accordions & Metadata Display */}
                          {(hasSources || hasMemories) && (
                            <div className="mt-4 pt-4 border-t border-[#2D3748]/60 space-y-2">
                              {/* RAG Evidence Accordion */}
                              {hasSources && (
                                <div className={`rounded-xl border overflow-hidden transition-all ${
                                  isDark ? 'border-[#2D3748] bg-[#0D1117]/60' : 'border-slate-200 bg-slate-50'
                                }`}>
                                  <button
                                    onClick={() => toggleSourcesAccordion(msg.id)}
                                    className="w-full px-3 py-2 flex items-center justify-between text-xs font-semibold text-left hover:opacity-90 transition-opacity cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2 text-[#38BDF8]">
                                      <Search className="w-3.5 h-3.5" />
                                      <span>Retrieved Vector Evidence ({msg.sources!.length} sources)</span>
                                    </div>
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${msg.showSourcesAccordion ? 'rotate-180' : ''}`} />
                                  </button>

                                  <AnimatePresence>
                                    {msg.showSourcesAccordion && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="px-3 pb-3 space-y-2 text-xs border-t border-[#2D3748]/40 pt-2"
                                      >
                                        {msg.sources!.map((src, sIdx) => (
                                          <div key={sIdx} className={`p-2.5 rounded-lg border font-mono text-[11px] ${
                                            isDark ? 'bg-[#161B22] border-[#2D3748] text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                                          }`}>
                                            <div className="flex items-center justify-between mb-1">
                                              <span className="font-semibold text-[#38BDF8] truncate max-w-[70%]">
                                                #{sIdx + 1} • {src.id}
                                              </span>
                                              {src.score != null && (
                                                <span className="px-1.5 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] font-bold text-[10px]">
                                                  {(src.score * 100).toFixed(1)}% Match
                                                </span>
                                              )}
                                            </div>
                                            <p className="line-clamp-2 text-[#94A3B8] font-sans text-xs">{src.snippet}</p>
                                          </div>
                                        ))}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              )}

                              {/* Long-Term Memory Accordion */}
                              {hasMemories && (
                                <div className={`rounded-xl border overflow-hidden transition-all ${
                                  isDark ? 'border-[#2D3748] bg-[#0D1117]/60' : 'border-slate-200 bg-slate-50'
                                }`}>
                                  <button
                                    onClick={() => toggleMemoriesAccordion(msg.id)}
                                    className="w-full px-3 py-2 flex items-center justify-between text-xs font-semibold text-left hover:opacity-90 transition-opacity cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2 text-[#8B5CF6]">
                                      <BrainCircuit className="w-3.5 h-3.5" />
                                      <span>User Memories Injected ({msg.memories!.length} facts)</span>
                                    </div>
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${msg.showMemoriesAccordion ? 'rotate-180' : ''}`} />
                                  </button>

                                  <AnimatePresence>
                                    {msg.showMemoriesAccordion && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="px-3 pb-3 space-y-1.5 text-xs border-t border-[#2D3748]/40 pt-2"
                                      >
                                        {msg.memories!.map((mem, mIdx) => (
                                          <div key={mIdx} className="flex items-center gap-2 text-slate-300">
                                            <span className="px-1.5 py-0.5 rounded bg-[#8B5CF6]/20 text-[#8B5CF6] font-bold text-[9px] uppercase tracking-wider shrink-0">
                                              {mem.fact_type}
                                            </span>
                                            <span className="text-xs text-slate-300">{mem.fact}</span>
                                          </div>
                                        ))}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              )}
                            </div>
                          )}

                          <div className={`flex items-center justify-between pt-4 border-t border-[#2D3748] mt-4`}>
                            <div className={`flex items-center gap-2 text-xs text-[#94A3B8]`}>
                              <Database className="w-3.5 h-3.5 text-[#10B981]" />
                              Grounding: Qdrant Vector DB + Sliding Window & User Memory
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  }
                })}

                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div className="absolute bottom-0 left-0 right-0 pt-4 bg-gradient-to-t from-[var(--bg-base)] via-[var(--bg-base)] to-transparent">
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelected}
                  accept=".txt,.csv,.md,.json"
                  className="hidden"
                />

                {/* Attachment Pill Badge */}
                {attachment && (
                  <div className="mb-2 px-3 py-1.5 rounded-xl border bg-[#8B5CF6]/15 border-[#8B5CF6]/40 text-[#8B5CF6] text-xs font-semibold flex items-center justify-between w-fit gap-3 animate-fade-in shadow-sm">
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[200px]">{attachment.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachment(null)}
                      className="p-0.5 hover:bg-[#8B5CF6]/20 rounded transition-colors cursor-pointer text-slate-400 hover:text-white"
                      title="Remove attachment"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (isGenerating) {
                      handleStopGeneration();
                    } else {
                      handleSend();
                    }
                  }}
                  className={`p-2 rounded-2xl border flex items-center gap-3 shadow-lg ${inputBg}`}
                >
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isGenerating}
                    className={`p-2 rounded-xl text-[#94A3B8] hover:text-white hover:bg-[#1E293B] transition-colors cursor-pointer disabled:opacity-50`}
                    title="Attach text file (.txt, .csv, .md, .json)"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>

                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={isGenerating}
                    placeholder={attachment ? `Ask something about ${attachment.name}...` : "Ask about your users, features, or roadmap..."}
                    className={`flex-1 bg-transparent border-none outline-none text-sm ${isDark ? 'text-white' : 'text-gray-900'} placeholder-[#64748B]`}
                  />

                  {isGenerating ? (
                    <button 
                      type="button"
                      onClick={handleStopGeneration}
                      className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-sm flex items-center gap-2 transition-colors cursor-pointer"
                      title="Stop generating"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" /> Stop
                    </button>
                  ) : (
                    <button 
                      type="submit"
                      disabled={!inputText.trim()}
                      className={`px-5 py-2.5 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm flex items-center gap-2 transition-colors cursor-pointer`}
                    >
                      Send <Sparkles className="w-3.5 h-3.5" />
                    </button>
                  )}
                </form>
              </div>
            </div>

            {/* Right Column - Side Panels */}
            <div className="w-80 space-y-4 h-full flex flex-col shrink-0 hidden xl:flex">
              
              {/* Suggested Questions */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`rounded-2xl border p-5 ${cardBg} shrink-0`}
              >
                <h3 className={`flex items-center gap-2 font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
                  <Sparkles className="w-5 h-5 text-[#8B5CF6]" /> Suggested Questions
                </h3>
                
                <div className="space-y-2">
                  {[
                    { icon: MessageSquare, text: 'What is driving churn this month?', color: 'text-[#8B5CF6]' },
                    { icon: Users, text: 'Summarize feedback from India users', color: 'text-[#3B82F6]' },
                    { icon: Bug, text: 'Which bugs are most critical?', color: 'text-[#EF4444]' },
                    { icon: FileText, text: 'Generate executive summary', color: 'text-[#8B5CF6]' },
                    { icon: TrendingUp, text: 'What features have highest demand?', color: 'text-[#8B5CF6]' }
                  ].map((item, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => handleSend(item.text)}
                      disabled={isGenerating}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left disabled:opacity-50 cursor-pointer ${
                        isDark 
                          ? 'border-[#2D3748] hover:border-[#475569] hover:bg-[#1E293B]/50 bg-[#0D1117]/50' 
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-100 bg-white shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={`w-4 h-4 ${item.color}`} />
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{item.text}</span>
                      </div>
                      <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* How This Works */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`rounded-2xl border p-5 ${cardBg} flex-1 overflow-y-auto scrollbar-hide`}
              >
                <h3 className={`flex items-center gap-2 font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>
                  <BrainCircuit className="w-5 h-5 text-[#8B5CF6]" /> RAG & Memory Pipeline
                </h3>
                
                <p className="text-xs leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
                  Questions are embedded into vectors, matched against your live feedback dataset and user long-term memory store, and processed with sliding-window history.
                </p>

                {/* Flow Diagram */}
                <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2 scrollbar-hide">
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${sectionBg}`}>
                      <span className="text-[#8B5CF6] font-bold text-sm">?</span>
                    </div>
                    <span className="text-[9px] font-semibold text-center" style={{ color: 'var(--text-secondary)' }}>Query</span>
                  </div>
                  
                  <ArrowRight className="w-3.5 h-3.5 text-[#475569] shrink-0" />
                  
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${sectionBg}`}>
                      <BrainCircuit className="w-4 h-4 text-[#8B5CF6]" />
                    </div>
                    <span className="text-[9px] font-semibold text-center" style={{ color: 'var(--text-secondary)' }}>Memory &<br/>Summary</span>
                  </div>

                  <ArrowRight className="w-3.5 h-3.5 text-[#475569] shrink-0" />

                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-xl border border-[#3B82F6]/50 bg-[#3B82F6]/10 flex items-center justify-center`}>
                      <Search className="w-4 h-4 text-[#3B82F6]" />
                    </div>
                    <span className="text-[9px] font-semibold text-center" style={{ color: 'var(--text-secondary)' }}>Qdrant<br/>Mesh</span>
                  </div>

                  <ArrowRight className="w-3.5 h-3.5 text-[#475569] shrink-0" />

                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-xl border border-[#8B5CF6]/50 bg-[#8B5CF6]/10 flex items-center justify-center`}>
                      <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
                    </div>
                    <span className="text-[9px] font-semibold text-center" style={{ color: 'var(--text-secondary)' }}>AI Response</span>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="grid grid-cols-2 gap-2">
                  <div className={`p-2 rounded-lg border flex items-center gap-2 ${
                    isDark ? 'border-[#10B981]/20 bg-[#052E16]/30' : 'border-emerald-200 bg-emerald-50'
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                    <div>
                      <div className={`text-[11px] font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>RAG Citations</div>
                      <div className="text-[10px] font-bold text-[#10B981]">Surfaced</div>
                    </div>
                  </div>

                  <div className={`p-2 rounded-lg border flex items-center gap-2 ${
                    isDark ? 'border-[#10B981]/20 bg-[#052E16]/30' : 'border-emerald-200 bg-emerald-50'
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                    <div>
                      <div className={`text-[11px] font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Workspace Scope</div>
                      <div className="text-[10px] font-bold text-[#10B981]">Active</div>
                    </div>
                  </div>

                  <div className={`p-2 rounded-lg border flex items-center gap-2 ${
                    isDark ? 'border-[#10B981]/20 bg-[#052E16]/30' : 'border-emerald-200 bg-emerald-50'
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                    <div>
                      <div className={`text-[11px] font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Long-Term Memory</div>
                      <div className="text-[10px] font-bold text-[#10B981]">Active</div>
                    </div>
                  </div>

                  <div className={`p-2 rounded-lg border flex items-center gap-2 ${
                    isDark ? 'border-[#10B981]/20 bg-[#052E16]/30' : 'border-emerald-200 bg-emerald-50'
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                    <div>
                      <div className={`text-[11px] font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Summarization</div>
                      <div className="text-[10px] font-bold text-[#10B981]">Rolling</div>
                    </div>
                  </div>
                </div>

              </motion.div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AskCopilotPage;