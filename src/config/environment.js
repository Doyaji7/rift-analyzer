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
  champions: '/champions',
  championDetail: (championId) => `/champions/${championId}`,
  summonerSearch: '/summoner/search',
  summonerMatches: (riotId) => `/summoner/${encodeURIComponent(riotId)}/matches`,
  summonerMastery: (riotId) => `/summoner/${encodeURIComponent(riotId)}/mastery`,
  matchAnalysis: '/analysis/match',
  trendAnalysis: '/analysis/trend',
  chat: '/chat'
};

// S3 paths for static data
export const s3Paths = {
  championData: '15.21.1/data/en_US/champion.json',
  championImages: '15.21.1/img/champion/',
  championSprites: '15.21.1/img/sprite/'
};