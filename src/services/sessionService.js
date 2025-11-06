// Configuration
const SESSION_EXPIRY_HOURS = 24;
const STORAGE_KEY = 'lol_session';
const TOKEN_PREFIX = 'lol_token_';

/**
 * Session Service for managing user sessions with JWT tokens
 * Handles session creation, validation, persistence, and expiry
 */
class SessionService {
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

    return { ...sessionData, token };
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
      const decodedString = atob(encodedData);
      const sessionData = JSON.parse(decodedString);
      
      // Check if session is expired
      if (new Date() > new Date(sessionData.expiresAt)) {
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
      const encodedData = btoa(dataString);
      return TOKEN_PREFIX + encodedData;
    } catch (error) {
      console.error('Failed to generate token:', error);
      throw new Error('Token generation failed');
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
    } catch (error) {
      console.error('Failed to save session to localStorage:', error);
    }
  }
}

// Create and export singleton instance
const sessionService = new SessionService();
export default sessionService;