// Configuration
const SESSION_EXPIRY_HOURS = 24;
const STORAGE_KEY = 'lol_session';
const TOKEN_PREFIX = 'lol_token_';

/**
 * Check if localStorage is available
 * @returns {boolean} True if localStorage is available
 */
function isLocalStorageAvailable() {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    console.error('localStorage is not available:', e);
    return false;
  }
}

/**
 * Safely encode string to base64 (handles Unicode)
 * @param {string} str - String to encode
 * @returns {string} Base64 encoded string
 */
function encodeBase64(str) {
  const bytes = new TextEncoder().encode(str);
  const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join('');
  return btoa(binString);
}

/**
 * Safely decode base64 to string (handles Unicode)
 * @param {string} base64 - Base64 string to decode
 * @returns {string} Decoded string
 */
function decodeBase64(base64) {
  const binString = atob(base64);
  const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * Session Service for managing user sessions with JWT tokens
 * Handles session creation, validation, persistence, and expiry
 */
class SessionService {
  constructor() {
    // Check localStorage availability on initialization
    if (!isLocalStorageAvailable()) {
      console.warn('localStorage is not available. Session management may not work properly.');
    }
  }

  /**
   * Create a new session for a summoner
   * @param {Object} summonerData - Summoner information
   * @param {string} summonerData.riotId - Riot ID (GameName#TAG)
   * @param {string} summonerData.region - Region code
   * @param {Object} dataLocations - S3 data locations
   * @param {Object} preferences - User preferences
   * @returns {Object} Session data with token
   */
  createSession(summonerData, dataLocations = {}, preferences = {}) {
    try {
      console.log('Creating session for:', summonerData);
      
      // Validate input
      if (!summonerData || !summonerData.riotId || !summonerData.region) {
        throw new Error('Invalid summoner data: riotId and region are required');
      }

      const sessionId = this.generateSessionId();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + (SESSION_EXPIRY_HOURS * 60 * 60 * 1000));
      
      const sessionData = {
        sessionId,
        summoner: {
          riotId: summonerData.riotId,
          safeName: this.convertToSafeName(summonerData.riotId),
          region: summonerData.region
        },
        dataLocations: {
          matchHistory: dataLocations.matchHistory || `match-history/${this.convertToSafeName(summonerData.riotId)}/`,
          mastery: dataLocations.mastery || `mastery-data/${this.convertToSafeName(summonerData.riotId)}/`
        },
        preferences: {
          language: preferences.language || 'ko',
          theme: preferences.theme || 'dark',
          ...preferences
        },
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString()
      };

      // Generate simple token
      const token = this.generateToken(sessionData);

      // Store in localStorage
      this.saveToStorage({ ...sessionData, token });

      console.log('Session created successfully:', sessionId);
      return { ...sessionData, token };
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  }

  /**
   * Validate and decode token
   * @param {string} token - Session token
   * @returns {Object|null} Decoded session data or null if invalid
   */
  validateToken(token) {
    try {
      if (!token || !token.startsWith(TOKEN_PREFIX)) {
        return null;
      }

      // Decode base64 token
      const encodedData = token.substring(TOKEN_PREFIX.length);
      const decodedString = decodeBase64(encodedData);
      const sessionData = JSON.parse(decodedString);
      
      // Check if session is expired
      if (new Date() > new Date(sessionData.expiresAt)) {
        console.log('Session expired');
        this.clearSession();
        return null;
      }
      
      return sessionData;
    } catch (error) {
      console.error('Token validation failed:', error);
      this.clearSession();
      return null;
    }
  }

  /**
   * Get current session from localStorage
   * @returns {Object|null} Current session data or null
   */
  getCurrentSession() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const sessionData = JSON.parse(stored);
      
      // Validate token
      const validatedData = this.validateToken(sessionData.token);
      if (!validatedData) return null;

      return sessionData;
    } catch (error) {
      console.error('Failed to get current session:', error);
      this.clearSession();
      return null;
    }
  }

  /**
   * Update session data
   * @param {Object} updates - Updates to apply to session
   * @returns {Object|null} Updated session data or null if no session
   */
  updateSession(updates) {
    const currentSession = this.getCurrentSession();
    if (!currentSession) return null;

    const updatedSession = {
      ...currentSession,
      ...updates,
      // Don't allow updating critical fields
      sessionId: currentSession.sessionId,
      createdAt: currentSession.createdAt,
      token: currentSession.token
    };

    this.saveToStorage(updatedSession);
    return updatedSession;
  }

  /**
   * Check if user has a valid session
   * @returns {boolean} True if session is valid
   */
  isSessionValid() {
    const session = this.getCurrentSession();
    return session !== null;
  }

  /**
   * Clear current session
   */
  clearSession() {
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Get summoner info from current session
   * @returns {Object|null} Summoner info or null
   */
  getSummonerInfo() {
    const session = this.getCurrentSession();
    return session ? session.summoner : null;
  }

  /**
   * Get data locations from current session
   * @returns {Object|null} Data locations or null
   */
  getDataLocations() {
    const session = this.getCurrentSession();
    return session ? session.dataLocations : null;
  }

  /**
   * Get user preferences from current session
   * @returns {Object|null} User preferences or null
   */
  getPreferences() {
    const session = this.getCurrentSession();
    return session ? session.preferences : null;
  }

  /**
   * Update user preferences
   * @param {Object} newPreferences - New preferences to merge
   * @returns {Object|null} Updated session or null
   */
  updatePreferences(newPreferences) {
    const currentSession = this.getCurrentSession();
    if (!currentSession) return null;

    return this.updateSession({
      preferences: {
        ...currentSession.preferences,
        ...newPreferences
      }
    });
  }

  // Private methods

  /**
   * Generate simple token from session data
   * @param {Object} sessionData - Session data to encode
   * @returns {string} Base64 encoded token
   */
  generateToken(sessionData) {
    try {
      const dataString = JSON.stringify(sessionData);
      const base64 = encodeBase64(dataString);
      return TOKEN_PREFIX + base64;
    } catch (error) {
      console.error('Failed to generate token:', error);
      console.error('Session data:', sessionData);
      throw new Error('Token generation failed: ' + error.message);
    }
  }

  /**
   * Generate unique session ID
   * @returns {string} UUID v4
   */
  generateSessionId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : ((r & 0x3) | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Convert Riot ID to safe name for S3 paths
   * @param {string} riotId - Riot ID (GameName#TAG)
   * @returns {string} Safe name for file paths
   */
  convertToSafeName(riotId) {
    return riotId.replace(/\s+/g, '_');
  }

  /**
   * Save session data to localStorage
   * @param {Object} sessionData - Session data to save
   */
  saveToStorage(sessionData) {
    try {
      const dataString = JSON.stringify(sessionData);
      localStorage.setItem(STORAGE_KEY, dataString);
      console.log('Session saved to localStorage');
    } catch (error) {
      console.error('Failed to save session to localStorage:', error);
      
      // Check if localStorage is available
      if (typeof localStorage === 'undefined') {
        throw new Error('localStorage is not available');
      }
      
      // Check if quota exceeded
      if (error.name === 'QuotaExceededError') {
        throw new Error('localStorage quota exceeded');
      }
      
      throw error;
    }
  }
}

// Create and export singleton instance
const sessionService = new SessionService();
export default sessionService;
