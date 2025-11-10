import React, { useState, useRef, useEffect } from 'react';
import { useSession } from '../contexts/SessionContext';
import { useTranslation } from '../hooks/useTranslation';
import { renderMarkdown } from '../utils/markdownRenderer';
import './ChatInterface.css';

const ChatInterface = ({ 
  contextType = 'general', 
  contextData = {}, 
  onClose,
  isGlobal = false 
}) => {
  const { t } = useTranslation();
  const { session } = useSession();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Generate session ID on component mount (33+ characters required)
    const timestamp = Date.now();
    const random1 = Math.random().toString(36).substring(2, 15);
    const random2 = Math.random().toString(36).substring(2, 15);
    setSessionId(`s${timestamp}${random1}${random2}`);
    
    // Add welcome message based on context
    const welcomeMessage = getWelcomeMessage(contextType);
    setMessages([{
      id: 1,
      type: 'ai',
      content: welcomeMessage,
      timestamp: new Date()
    }]);
  }, [contextType]);

  useEffect(() => {
    // Only auto-scroll when new messages are added (not on initial mount)
    if (messages.length > 1) {
      scrollToBottom();
    }
  }, [messages]);

  const scrollToBottom = () => {
    // Use smooth scroll only for new messages, not initial load
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  };

  const getWelcomeMessage = (type) => {
    switch (type) {
      case 'champion':
        return t('chat.welcome.champion');
      case 'match':
        return t('chat.welcome.match');
      case 'trend':
        return t('chat.welcome.trend');
      default:
        return t('chat.welcome.general');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputText.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage(inputText.trim());
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendChatMessage = async (query) => {
    const { config, endpoints } = await import('../config/environment');

    // Call API Gateway endpoint
    const response = await fetch(`${config.apiUrl}${endpoints.chat}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: query,
        sessionId: sessionId,
        contextType: contextType,
        contextData: {
          ...contextData,
          summonerName: session?.summoner?.riotId
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get response from AI');
    }

    const data = await response.json();
    return data.response || data.result || '응답을 받지 못했습니다.';
  };

  const formatMessage = (content) => {
    // Use markdown renderer for rich text formatting
    return renderMarkdown(content);
  };

  const getSuggestedQuestions = () => {
    switch (contextType) {
      case 'champion':
        return [
          t('chat.suggestions.champion.q1'),
          t('chat.suggestions.champion.q2'),
          t('chat.suggestions.champion.q3'),
          t('chat.suggestions.champion.q4')
        ];
      case 'match':
        return [
          t('chat.suggestions.match.q1'),
          t('chat.suggestions.match.q2'),
          t('chat.suggestions.match.q3'),
          t('chat.suggestions.match.q4')
        ];
      case 'trend':
        return [
          t('chat.suggestions.trend.q1'),
          t('chat.suggestions.trend.q2'),
          t('chat.suggestions.trend.q3'),
          t('chat.suggestions.trend.q4')
        ];
      default:
        return [
          t('chat.suggestions.general.q1'),
          t('chat.suggestions.general.q2'),
          t('chat.suggestions.general.q3'),
          t('chat.suggestions.general.q4')
        ];
    }
  };

  const handleSuggestedQuestion = (question) => {
    setInputText(question);
  };

  return (
    <div className={`chat-interface ${isGlobal ? 'global-chat' : 'context-chat'}`}>
      {!isGlobal && onClose && (
        <div className="chat-header">
          <h3>AI 분석 도우미</h3>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>
      )}

      <div className="messages-container">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`message ${message.type} ${message.isError ? 'error' : ''}`}
          >
            <div className="message-content">
              {formatMessage(message.content)}
            </div>
            <div className="message-timestamp">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message ai loading">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {messages.length === 1 && (
        <div className="suggested-questions">
          <p>{t('chat.suggestedQuestions')}</p>
          <div className="question-buttons">
            {getSuggestedQuestions().map((question, index) => (
              <button
                key={index}
                className="suggested-question"
                onClick={() => handleSuggestedQuestion(question)}
                disabled={isLoading}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="chat-input-form">
        <div className="input-container">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t('chat.placeholder')}
            disabled={isLoading}
            className="chat-input"
          />
          <button 
            type="submit" 
            disabled={!inputText.trim() || isLoading}
            className="send-button"
          >
            {isLoading ? '⏳' : '📤'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;