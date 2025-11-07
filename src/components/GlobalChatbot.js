import React, { useState } from 'react';
import ChatInterface from './ChatInterface';
import './GlobalChatbot.css';

const GlobalChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Toggle chat clicked, current state:', isOpen);
    setIsOpen(!isOpen);
  };

  return (
    <div className="global-chatbot">
      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-title">
              <div className="bot-avatar">🤖</div>
              <div>
                <h4>LoL AI 어시스턴트</h4>
              </div>
            </div>
            <button 
              className="minimize-btn" 
              onClick={toggleChat}
              type="button"
              aria-label="챗봇 최소화"
              title="최소화"
            >
              🔙
            </button>
          </div>

          <div className="chat-content">
            <ChatInterface 
              contextType="general"
              contextData={{}}
              isGlobal={true}
            />
          </div>
        </div>
      )}

      {/* Chat Toggle Button - Only show when closed */}
      {!isOpen && (
        <button 
          className="chat-toggle"
          onClick={toggleChat}
          aria-label="챗봇 열기"
          title="AI 챗봇 열기"
        >
          💬
          <div className="notification-dot"></div>
        </button>
      )}
    </div>
  );
};

export default GlobalChatbot;