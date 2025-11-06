import React, { createContext, useContext, useReducer, useEffect } from 'react';
import sessionService from '../services/sessionService';

// Session Context
const SessionContext = createContext();

// Action types
const SESSION_ACTIONS = {
  SET_SESSION: 'SET_SESSION',
  CLEAR_SESSION: 'CLEAR_SESSION',
  UPDATE_SESSION: 'UPDATE_SESSION',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR'
};

// Initial state
const initialState = {
  session: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

// Reducer
function sessionReducer(state, action) {
  switch (action.type) {
    case SESSION_ACTIONS.SET_SESSION:
      return {
        ...state,
        session: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
        error: null
      };
    
    case SESSION_ACTIONS.CLEAR_SESSION:
      return {
        ...state,
        session: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };
    
    case SESSION_ACTIONS.UPDATE_SESSION:
      return {
        ...state,
        session: action.payload,
        error: null
      };
    
    case SESSION_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
    
    case SESSION_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
    
    default:
      return state;
  }
}

// Session Provider Component
export function SessionProvider({ children }) {
  const [state, dispatch] = useReducer(sessionReducer, initialState);

  // Initialize session on app load
  useEffect(() => {
    const initializeSession = () => {
      try {
        const currentSession = sessionService.getCurrentSession();
        if (currentSession) {
          dispatch({ type: SESSION_ACTIONS.SET_SESSION, payload: currentSession });
        } else {
          dispatch({ type: SESSION_ACTIONS.SET_LOADING, payload: false });
        }
      } catch (error) {
        console.error('Failed to initialize session:', error);
        dispatch({ type: SESSION_ACTIONS.SET_ERROR, payload: 'Failed to restore session' });
      }
    };

    initializeSession();
  }, []);

  // Session management functions
  const createSession = (summonerData, dataLocations, preferences) => {
    try {
      dispatch({ type: SESSION_ACTIONS.SET_LOADING, payload: true });
      const newSession = sessionService.createSession(summonerData, dataLocations, preferences);
      dispatch({ type: SESSION_ACTIONS.SET_SESSION, payload: newSession });
      return newSession;
    } catch (error) {
      console.error('Failed to create session:', error);
      dispatch({ type: SESSION_ACTIONS.SET_ERROR, payload: 'Failed to create session' });
      return null;
    }
  };

  const clearSession = () => {
    try {
      sessionService.clearSession();
      dispatch({ type: SESSION_ACTIONS.CLEAR_SESSION });
    } catch (error) {
      console.error('Failed to clear session:', error);
      dispatch({ type: SESSION_ACTIONS.SET_ERROR, payload: 'Failed to clear session' });
    }
  };

  const updateSession = (updates) => {
    try {
      const updatedSession = sessionService.updateSession(updates);
      if (updatedSession) {
        dispatch({ type: SESSION_ACTIONS.UPDATE_SESSION, payload: updatedSession });
      }
      return updatedSession;
    } catch (error) {
      console.error('Failed to update session:', error);
      dispatch({ type: SESSION_ACTIONS.SET_ERROR, payload: 'Failed to update session' });
      return null;
    }
  };

  const updatePreferences = (newPreferences) => {
    try {
      const updatedSession = sessionService.updatePreferences(newPreferences);
      if (updatedSession) {
        dispatch({ type: SESSION_ACTIONS.UPDATE_SESSION, payload: updatedSession });
      }
      return updatedSession;
    } catch (error) {
      console.error('Failed to update preferences:', error);
      dispatch({ type: SESSION_ACTIONS.SET_ERROR, payload: 'Failed to update preferences' });
      return null;
    }
  };

  const getSummonerInfo = () => {
    return state.session ? state.session.summoner : null;
  };

  const getDataLocations = () => {
    return state.session ? state.session.dataLocations : null;
  };

  const getPreferences = () => {
    return state.session ? state.session.preferences : null;
  };

  const clearError = () => {
    dispatch({ type: SESSION_ACTIONS.SET_ERROR, payload: null });
  };

  // Context value
  const contextValue = {
    // State
    session: state.session,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    createSession,
    clearSession,
    updateSession,
    updatePreferences,
    
    // Getters
    getSummonerInfo,
    getDataLocations,
    getPreferences,
    
    // Utilities
    clearError
  };

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
}

// Custom hook to use session context
export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

export default SessionContext;