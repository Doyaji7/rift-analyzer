# LoL Match Analyzer

리그오브레전드 전적 분석 및 AI 챗봇 서비스

## Project Structure

```
lol-match-analyzer/
├── public/                 # Static assets
├── src/                   # React frontend source
│   ├── config/           # Environment configuration
│   ├── components/       # React components (to be implemented)
│   └── services/         # API service functions (to be implemented)
├── lambda/               # AWS Lambda functions
├── infrastructure/       # CloudFormation templates
├── 15.21.1/             # Champion data (existing)
├── gameplay_knowledge_base/ # AI knowledge base (existing)
└── prompt/              # AI analysis prompts (existing)
```

## Prerequisites

- Node.js 16+ and npm
- AWS CLI configured with appropriate permissions
- AWS SAM CLI for Lambda deployment
- Git for version control

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm start
```

The app will run on http://localhost:3000

## AWS Infrastructure Deployment

1. Deploy S3 buckets and IAM roles:
```bash
./infrastructure/deploy.sh prod us-east-1
```

2. Upload champion data to S3:
```bash
aws s3 sync 15.21.1/ s3://your-data-bucket/15.21.1/ --region us-east-1
```

## Environment Configuration

The app uses environment variables for configuration:
- `REACT_APP_API_URL`: API Gateway endpoint
- `REACT_APP_DATA_BUCKET`: S3 bucket name for data
- `REACT_APP_REGION`: AWS region
- `REACT_APP_ENVIRONMENT`: Environment (dev/staging/prod)

## API Endpoints

- `GET /api/champions` - List all champions
- `GET /api/champions/{id}` - Get champion details
- `POST /api/summoner/search` - Search summoner and collect data
- `GET /api/summoner/{riotId}/matches` - Get match history
- `GET /api/summoner/{riotId}/mastery` - Get champion mastery
- `POST /api/analysis/match` - Analyze single match
- `POST /api/analysis/trend` - Analyze play trends
- `POST /api/chat` - AI chatbot interaction

## Next Steps

This infrastructure setup provides the foundation for:
1. Champion data service implementation
2. React frontend development
3. Summoner data collection
4. AI analysis integration
5. Session management

Each component will be implemented in subsequent tasks according to the implementation plan.