/**
 * Image utility functions for generating CloudFront CDN URLs
 * for League of Legends static assets
 */

const CLOUDFRONT_URL = process.env.REACT_APP_CLOUDFRONT_URL || 'https://d3niiaajvbtu1l.cloudfront.net/lol-data';
const DEFAULT_VERSION = process.env.REACT_APP_LOL_VERSION || '15.21.1';

/**
 * Generate CloudFront URL for champion image
 * @param {string} championKey - Champion key (e.g., 'Ahri', 'MasterYi')
 * @param {string} version - Data Dragon version (default: current version)
 * @returns {string} Full CloudFront URL for champion image
 */
export const getChampionImageUrl = (championKey, version = DEFAULT_VERSION) => {
  if (!championKey) {
    console.warn('getChampionImageUrl: championKey is required');
    return '';
  }
  return `${CLOUDFRONT_URL}/${version}/img/champion/${championKey}.png`;
};

/**
 * Generate CloudFront URL for item image
 * @param {number} itemId - Item ID
 * @param {string} version - Data Dragon version (default: current version)
 * @returns {string} Full CloudFront URL for item image
 */
export const getItemImageUrl = (itemId, version = DEFAULT_VERSION) => {
  if (!itemId || itemId === 0) {
    return '';
  }
  return `${CLOUDFRONT_URL}/${version}/img/item/${itemId}.png`;
};

/**
 * Generate CloudFront URL for spell image
 * @param {string} spellImage - Spell image filename (e.g., 'SummonerFlash.png')
 * @param {string} version - Data Dragon version (default: current version)
 * @returns {string} Full CloudFront URL for spell image
 */
export const getSpellImageUrl = (spellImage, version = DEFAULT_VERSION) => {
  if (!spellImage) {
    console.warn('getSpellImageUrl: spellImage is required');
    return '';
  }
  return `${CLOUDFRONT_URL}/${version}/img/spell/${spellImage}`;
};

/**
 * Generate CloudFront URL for passive ability image
 * @param {string} passiveImage - Passive image filename
 * @param {string} version - Data Dragon version (default: current version)
 * @returns {string} Full CloudFront URL for passive image
 */
export const getPassiveImageUrl = (passiveImage, version = DEFAULT_VERSION) => {
  if (!passiveImage) {
    console.warn('getPassiveImageUrl: passiveImage is required');
    return '';
  }
  return `${CLOUDFRONT_URL}/${version}/img/passive/${passiveImage}`;
};

/**
 * Generate CloudFront URL for profile icon
 * @param {number} iconId - Profile icon ID
 * @param {string} version - Data Dragon version (default: current version)
 * @returns {string} Full CloudFront URL for profile icon
 */
export const getProfileIconUrl = (iconId, version = DEFAULT_VERSION) => {
  if (!iconId) {
    console.warn('getProfileIconUrl: iconId is required');
    return '';
  }
  return `${CLOUDFRONT_URL}/${version}/img/profileicon/${iconId}.png`;
};
