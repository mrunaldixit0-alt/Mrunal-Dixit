import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import {
  Bot,
  X,
  Send,
  Sparkles,
  ShoppingBag,
  Eye,
  RefreshCw,
  Flame,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

export default function Chatbot({ onViewFoodDetails }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToCart } = useCart();
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hello! 👋 Welcome to Smart Dine Restaurant System! I am your Requirement-Based Food Assistant.\n\nTell me what you feel like eating today! For example:\n• \"I am fasting today\"\n• \"I want Jain food\"\n• \"Suggest something healthy\"\n• \"Something spicy\"",
      suggestions: [],
      suggestedPrompts: [
        "I am fasting today",
        "Suggest something healthy",
        "I want Jain food",
        "Something spicy",
        "Show sweet desserts"
      ]
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputMessage;
    if (!query.trim() || loading) return;

    const userMsg = { sender: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await axios.post('/api/chatbot/suggest', { message: query });
      const { botReply, suggestions, suggestedPrompts } = response.data;

      const botMsg = {
        sender: 'bot',
        text: botReply,
        suggestions: suggestions || [],
        suggestedPrompts: suggestedPrompts || []
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: "I'm having trouble retrieving menu suggestions right now. Please try selecting one of the requirement buttons below!",
          suggestions: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chatbot Toggle Button */}
      <div className="fixed bottom-6 right-6 z-40">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center space-x-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 px-5 py-4 rounded-full shadow-2xl hover:scale-105 transition-all duration-300 ring-4 ring-amber-400/20 active:scale-95"
          >
            <div className="relative">
              <Bot className="w-7 h-7 stroke-[2.2]" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-950" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-black tracking-wider uppercase leading-none">
                Food Assistant
              </span>
              <span className="text-[11px] font-bold text-slate-900/90 leading-tight">
                Ask for Fasting, Jain, Healthy & More
              </span>
            </div>
            <Sparkles className="w-5 h-5 text-amber-200 animate-pulse" />
          </button>
        )}
      </div>

      {/* Floating Chat Drawer Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[440px] h-[640px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-fadeIn">

          {/* Chat Window Header */}
          <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 font-bold shadow-md">
                <Bot className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center space-x-1.5">
                  <span>Smart Dine AI Assistant</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </h3>
                <p className="text-[11px] text-amber-300 font-medium">
                  Dynamic Requirement Food Finder
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-amber-500 text-slate-950 font-semibold rounded-br-none shadow-md'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Render Suggested Food Item Cards inside Chatbot */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="w-full mt-3 space-y-2.5">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
                      Matched Available Dishes ({msg.suggestions.length})
                    </p>
                    <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                      {msg.suggestions.map((food) => (
                        <div
                          key={food.id}
                          className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between space-x-3 hover:border-amber-400 transition-all"
                        >
                          <img
                            src={food.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'}
                            alt={food.name}
                            className="w-14 h-14 rounded-xl object-cover shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h5 className="font-bold text-xs text-slate-900 truncate">
                              {food.name}
                            </h5>
                            <p className="text-[11px] text-amber-600 font-extrabold">
                              ₹{food.price}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(food.tags || '').split(',').slice(0, 2).map((t, idx) => (
                                <span key={idx} className="text-[9px] font-semibold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                                  {t.trim()}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col space-y-1.5 shrink-0">
                            <button
                              onClick={() => {
                                if (onViewFoodDetails) onViewFoodDetails(food);
                              }}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold flex items-center justify-center"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => addToCart(food, 1)}
                              disabled={!food.is_available}
                              className="px-2 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] flex items-center justify-center shadow-sm"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Requirement Quick Chips */}
                {msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 max-w-full">
                    {msg.suggestedPrompts.map((prompt, pIdx) => (
                      <button
                        key={pIdx}
                        onClick={() => handleSendMessage(prompt)}
                        className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-800 border border-amber-500/30 hover:bg-amber-500 hover:text-slate-950 transition-all text-left flex items-center space-x-1"
                      >
                        <span>{prompt}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center space-x-2 text-slate-500 text-xs p-2">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                <span>Searching dynamic restaurant database for matches...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2"
          >
            <input
              type="text"
              placeholder="e.g. 'I am fasting today' or 'Jain food'..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="p-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </>
  );
}
