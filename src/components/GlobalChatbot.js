import React, { useState } from 'react';
import ChatInterface from './ChatInterface';
import { useTranslation } from '../hooks/useTranslation';
import './GlobalChatbot.css';

const GlobalChatbot = () => {
  const { t } = useTranslation();
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
                <h4>{t('chat.title')}</h4>
              </div>
            </div>
            <button 
              className="minimize-btn" 
              onClick={toggleChat}
              type="button"
              aria-label={t('chat.minimize')}
              title={t('chat.minimize')}
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
          aria-label={t('chat.open')}
          title={t('chat.open')}
        >
          💬
          <div className="notification-dot"></div>
        </button>
      )}
    </div>
  );
};

export default GlobalChatbot;