import React, { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { TopNavbar } from '../components/TopNavbar';
import { Bot, Send, Sparkles, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';

export const AskCopilotPage: React.FC = () => {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const [messages, setMessages] = useState([
    { sender: 'bot', text: `Hello ${user?.name?.split(' ')[0] || 'there'}! I am your AI Product Manager Copilot. Ask me anything about feedback trends, feature prioritization, or PRD specs!` },
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setInput('');
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: `Based on your recent feedback ingestion data: "${userMsg}" relates to 24 extracted themes. "Complex onboarding process" is currently the top pain point with 892 mentions (24.1% of total). I recommend drafting a PRD for Onboarding Tooltips!`,
        },
      ]);
    }, 1000);
  };

  return (
    <div className="min-h-screen transition-colors duration-200 flex flex-col" style={{ backgroundColor: 'var(--bg-base)' }}>
      <Sidebar />
      <TopNavbar searchPlaceholder="Search conversation..." />
      <div className={`${isCollapsed ? 'ml-16' : 'ml-60'} pt-16 flex-1 flex flex-col transition-all duration-300 ease-in-out`}>
        <main className="px-8 py-8 space-y-6 max-w-screen-2xl flex-1 flex flex-col justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
              <Bot className="w-6 h-6 text-[#3B82F6]" /> Ask Copilot
            </h1>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              Conversational assistant powered by your product knowledge graph.
            </p>
          </div>

          <div className="flex-1 min-h-[380px] p-6 theme-card rounded-2xl space-y-4 overflow-y-auto max-h-[500px]">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-3 text-xs leading-relaxed max-w-2xl ${
                  m.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold ${
                    m.sender === 'user' ? 'bg-[#3B82F6] text-white' : 'bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] text-white'
                  }`}
                >
                  {m.sender === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </div>
                <div
                  className={`p-4 rounded-2xl ${
                    m.sender === 'user'
                      ? 'bg-[#3B82F6] text-white'
                      : 'border'
                  }`}
                  style={
                    m.sender === 'user'
                      ? {}
                      : {
                          backgroundColor: 'var(--bg-surface-2)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-secondary)',
                        }
                  }
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask Copilot a question about user feedback, PRDs, or roadmaps..."
              className="flex-1 p-3.5 rounded-xl border text-xs focus:outline-none focus:border-[#3B82F6]"
              style={{
                backgroundColor: 'var(--bg-surface-2)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
            <button
              onClick={handleSend}
              className="p-3.5 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white font-bold hover:opacity-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};
