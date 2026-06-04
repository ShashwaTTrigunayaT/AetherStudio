import React, { useState, useRef, useEffect } from 'react';
import { api } from '../../lib/api';
import { Send, Loader2, Bot, User as UserIcon, Wand } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AIChatPanel() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/ai/chat', { message: input });
      const aiMessage = { role: 'ai', content: data.reply };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: `Error: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative" style={{ background: 'var(--bg-secondary)' }}>
      {/* Premium ambient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 15% 25%, rgba(255,255,255,0.06) 0%, transparent 55%),
            radial-gradient(ellipse at 85% 75%, rgba(255,255,255,0.04) 0%, transparent 50%),
            transparent
          `,
        }}
      />

      {/* Ambient light at top */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-px pointer-events-none z-10"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
          boxShadow: '0 0 30px rgba(255,255,255,0.15), 0 0 60px rgba(255,255,255,0.05)',
        }}
      />

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto relative z-10" style={{ minHeight: 0 }}>
        {messages.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 py-8">
            <div className="relative mb-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center relative"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.35), rgba(255,255,255,0.25))',
                  boxShadow: '0 0 24px rgba(255,255,255,0.3), 0 0 48px rgba(255,255,255,0.15)',
                }}
              >
                <Wand size={22} className="text-white" />
              </div>
              <div
                className="absolute -inset-[6px] rounded-2xl blur-[6px] opacity-50"
                style={{
                  border: '2px solid rgba(255,255,255,0.3)',
                }}
              />
            </div>
            <p className="text-[15px] font-semibold mb-1" style={{ color: 'rgba(245,245,247,0.7)' }}>
              AI Assistant
            </p>
            <p className="text-[13px] max-w-[200px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Ask me anything about your code, or to help you write something new.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 relative ${
                    msg.role === 'user'
                      ? 'bg-[rgba(255,255,255,0.08)]'
                      : ''
                  }`}
                  style={
                    msg.role === 'ai'
                      ? {
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.35), rgba(255,255,255,0.25))',
                          boxShadow: '0 0 16px rgba(255,255,255,0.2), 0 0 32px rgba(255,255,255,0.1)',
                        }
                      : {}
                  }
                >
                  {msg.role === 'user' ? (
                    <UserIcon size={14} className="text-[rgba(255,255,255,0.35)]" />
                  ) : (
                    <Bot size={14} className="text-white" />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                    msg.role === 'user'
                      ? 'rounded-tr-sm'
                      : 'rounded-tl-sm'
                  }`}
                  style={{
                    background: msg.role === 'user' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                    color: msg.role === 'user' ? 'rgba(245,245,247,0.9)' : 'rgba(255,255,255,0.65)',
                    border: msg.role === 'user' ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.35), rgba(255,255,255,0.25))',
                boxShadow: '0 0 16px rgba(255,255,255,0.2), 0 0 32px rgba(255,255,255,0.1)',
              }}
            >
              <Bot size={14} className="text-white" />
            </motion.div>
            <div className="bg-[rgba(255,255,255,0.03)] rounded-2xl rounded-tl-sm px-4 py-3 border border-[rgba(255,255,255,0.04)]">
              <motion.div className="flex gap-1.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <motion.span
                  animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: 0 }}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: 'rgba(255,255,255,0.35)' }}
                />
                <motion.span
                  animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
                />
                <motion.span
                  animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Neon gradient divider above input */}
      <div className="relative z-10 mx-3 h-px" style={{
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), rgba(255,255,255,0.06), transparent)',
      }} />

      {/* Input */}
      <div className="p-3 relative z-10">
        <div
          className="flex items-center gap-2 rounded-xl border transition-colors"
          style={{
            background: 'rgba(255,255,255,0.03)',
            borderColor: 'rgba(255,255,255,0.08)',
            boxShadow: 'inset 0 0 20px rgba(255,255,255,0.02)',
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="Ask AI..."
            className="flex-1 bg-transparent px-3 py-2.5 text-[13px] text-[rgba(245,245,247,0.8)] placeholder:text-[rgba(255,255,255,0.2)] focus:outline-none"
          />
          <motion.button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            whileHover={loading || !input.trim() ? undefined : {
              boxShadow: '0 0 20px rgba(255,255,255,0.3), 0 0 40px rgba(255,255,255,0.15)',
            }}
            whileTap={loading || !input.trim() ? undefined : { scale: 0.95 }}
            className="p-2 mr-1 rounded-lg text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.35), rgba(255,255,255,0.25))',
              boxShadow: loading || !input.trim() ? 'none' : '0 0 12px rgba(255,255,255,0.3)',
            }}
          >
            {loading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Send size={15} />
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
