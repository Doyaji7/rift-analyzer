import React, { useState } from 'react';
import ChatInterface from './ChatInterface';
import './GlobalChatbot.css';

const GlobalChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => {
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
                <span className="status">온라인</span>
              </div>
            </div>
            <button className="close-btn" onClick={toggleChat}>
              ✕
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

      {/* Chat Toggle Button */}
      <button 
        className={`chat-toggle ${isOpen ? 'open' : ''}`}
        onClick={toggleChat}
      >
        {isOpen ? '✕' : '💬'}
        {!isOpen && <div className="notification-dot"></div>}
      </button>
    </div>
  );
};

export default GlobalChatbot;