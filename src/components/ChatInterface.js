import React, { useState, useRef, useEffect } from 'react';
import { useSession } from '../contexts/SessionContext';
import './ChatInterface.css';

const ChatInterface = ({ 
  contextType = 'general', 
  contextData = {}, 
  onClose,
  isGlobal = false 
}) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);
  const { session } = useSession();

  useEffect(() => {
    // Generate session ID on component mount (33+ characters required)
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    setSessionId(`s${timestamp}${random}`);
    
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
        return '안녕하세요! 챔피언에 대해 궁금한 것이 있으시면 언제든 물어보세요. 빌드, 스킬 순서, 플레이 팁 등 무엇이든 도와드릴게요! 🎮';
      case 'match':
        return '매치 분석을 도와드릴게요! 게임에서의 성과나 개선점에 대해 궁금한 점이 있으시면 말씀해주세요. 📊';
      case 'trend':
        return '플레이 성향 분석을 시작해볼까요? 최근 게임들의 패턴이나 개선 방향에 대해 분석해드릴 수 있어요! 📈';
      default:
        return '안녕하세요! 리그오브레전드에 대해 무엇이든 물어보세요. 챔피언 공략, 매치 분석, 플레이 팁 등 도움이 필요한 것이 있으면 언제든 말씀해주세요! ⚡';
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
    // Simple formatting for better readability
    return content
      .split('\n')
      .map((line, index) => (
        <div key={index} className="message-line">
          {line}
        </div>
      ));
  };

  const getSuggestedQuestions = () => {
    switch (contextType) {
      case 'champion':
        return [
          '이 챔피언의 추천 빌드는?',
          '스킬 순서는 어떻게 해야 하나요?',
          '라인전에서 주의할 점은?',
          '팀파이트에서의 역할은?'
        ];
      case 'match':
        return [
          '이 게임에서 잘한 점은?',
          '개선할 점이 있다면?',
          'KDA가 낮은 이유는?',
          '아이템 빌드는 적절했나요?'
        ];
      case 'trend':
        return [
          '최근 성과는 어떤가요?',
          '주로 하는 챔피언 분석해주세요',
          '플레이 스타일의 특징은?',
          '어떤 점을 개선하면 좋을까요?'
        ];
      default:
        return [
          '추천 챔피언이 있나요?',
          '최근 메타는 어떤가요?',
          '실력 향상 팁을 알려주세요',
          '포지션별 특징을 설명해주세요'
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
          <p>이런 질문들을 해보세요:</p>
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
            placeholder="메시지를 입력하세요..."
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