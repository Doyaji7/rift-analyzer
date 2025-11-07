// Environment configuration for LoL Match Analyzer
// This file will be updated by the deployment script

export const config = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  dataBucket: process.env.REACT_APP_DATA_BUCKET || 'lol-match-analyzer-data-dev',
  region: process.env.REACT_APP_REGION || 'us-east-1',
  environment: process.env.REACT_APP_ENVIRONMENT || 'development'
};

// API endpoints
export const endpoints = {
  summonerSearch: '/summoner/search',
  summonerMatches: (riotId) => `/summoner/${encodeURIComponent(riotId)}/matches`,
  summonerMastery: (riotId) => `/summoner/${encodeURIComponent(riotId)}/mastery`,
  matchAnalysis: '/analysis/match',
  trendAnalysis: '/analysis/trend',
  chat: '/chat'
};

// CloudFront CDN for LoL data
const CLOUDFRONT_URL = process.env.REACT_APP_CLOUDFRONT_URL || 'https://d3niiaajvbtu1l.cloudfront.net/lol-data';
const LOL_VERSION = process.env.REACT_APP_LOL_VERSION || '15.21.1';

export const dataDragon = {
  baseUrl: CLOUDFRONT_URL,
  version: LOL_VERSION,
  championDataUrl: (version = LOL_VERSION, lang = 'en_US') => 
    `${CLOUDFRONT_URL}/${version}/data/${lang}/champion.json`,
  championImageUrl: (version = LOL_VERSION, championImage) => 
    `${CLOUDFRONT_URL}/${version}/img/champion/${championImage}`,
  spellImageUrl: (version = LOL_VERSION, spellImage) => 
    `${CLOUDFRONT_URL}/${version}/img/spell/${spellImage}`,
  passiveImageUrl: (version = LOL_VERSION, passiveImage) => 
    `${CLOUDFRONT_URL}/${version}/img/passive/${passiveImage}`
};