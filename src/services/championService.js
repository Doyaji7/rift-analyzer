import { dataDragon } from '../config/environment';

/**
 * Fetch champion data from CloudFront CDN
 * @param {string} language - Language code (e.g., 'ko_KR', 'en_US')
 * @param {number} retries - Number of retry attempts
 * @returns {Promise<Object>} Champion data object
 */
export const fetchChampionData = async (language = 'ko_KR', retries = 3) => {
  const url = dataDragon.championDataUrl(dataDragon.version, language);
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Return the champion data object
      return data.data;
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed to fetch champion data:`, error);
      
      // If this was the last attempt, throw the error
      if (attempt === retries - 1) {
        throw new Error(`Failed to fetch champion data after ${retries} attempts: ${error.message}`);
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
};

/**
 * Fetch detailed champion data for a specific champion
 * @param {string} championKey - Champion key (e.g., 'Ahri', 'LeeSin')
 * @param {string} language - Language code (e.g., 'ko_KR', 'en_US')
 * @returns {Promise<Object>} Detailed champion data
 */
export const fetchChampionDetails = async (championKey, language = 'ko_KR') => {
  const CLOUDFRONT_URL = dataDragon.baseUrl;
  const version = dataDragon.version;
  const url = `${CLOUDFRONT_URL}/${version}/data/${language}/champion/${championKey}.json`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Return the specific champion data
    return data.data[championKey];
  } catch (error) {
    console.error(`Failed to fetch champion details for ${championKey}:`, error);
    throw error;
  }
};

/**
 * Get localized champion name from champion ID or key
 * @param {string} championKey - Champion key (e.g., 'Ahri', 'LeeSin')
 * @param {Object} championData - Champion data object (from fetchChampionData)
 * @returns {string} Localized champion name
 */
export const getLocalizedChampionName = (championKey, championData) => {
  if (!championKey || !championData) return championKey;
  
  // Find champion by key (case-insensitive)
  const champion = Object.values(championData).find(
    champ => champ.id.toLowerCase() === championKey.toLowerCase()
  );
  
  return champion ? champion.name : championKey;
};
