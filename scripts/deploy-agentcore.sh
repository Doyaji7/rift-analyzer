#!/bin/bash

# BedrockAgentCore Runtime Deployment Script for LoL Match Analyzer
# This script builds and deploys the AgentCore runtime

set -e

# Configuration
ENVIRONMENT=${1:-prod}
AWS_REGION=${AWS_REGION:-us-east-1}
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPOSITORY="lol-agentcore-runtime"
RUNTIME_NAME="lol-analyzer-runtime-${ENVIRONMENT}"

echo "🚀 Deploying BedrockAgentCore Runtime for LoL Match Analyzer..."
echo "Environment: $ENVIRONMENT"
echo "AWS Region: $AWS_REGION"
echo "AWS Account: $AWS_ACCOUNT_ID"

# Set environment variables
export DATA_BUCKET=${DATA_BUCKET:-"lol-match-analyzer-data-${ENVIRONMENT}"}
export KNOWLEDGE_BASE_ID=${KNOWLEDGE_BASE_ID:-""}
export AGENTCORE_SOURCE_BUCKET=${AGENTCORE_SOURCE_BUCKET:-"lol-agentcore-source-${ENVIRONMENT}"}

echo "📦 Configuration:"
echo "  Data Bucket: $DATA_BUCKET"
echo "  Knowledge Base ID: $KNOWLEDGE_BASE_ID"
echo "  Source Bucket: $AGENTCORE_SOURCE_BUCKET"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Create ECR repository if it doesn't exist
echo "🏗️ Setting up ECR repository..."
aws ecr describe-repositories --repository-names $ECR_REPOSITORY --region $AWS_REGION > /dev/null 2>&1 || \
aws ecr create-repository --repository-name $ECR_REPOSITORY --region $AWS_REGION

# Get ECR login token
echo "🔐 Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build Docker image
echo "🔨 Building AgentCore runtime Docker image..."
cd agentcore-runtime
docker build -t $ECR_REPOSITORY:latest .
docker tag $ECR_REPOSITORY:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest

# Push to ECR
echo "📤 Pushing image to ECR..."
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest

cd ..

# Create IAM role for AgentCore runtime if it doesn't exist
echo "🔑 Setting up IAM role..."
ROLE_NAME="BedrockAgentCoreExecutionRole-${ENVIRONMENT}"
ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/${ROLE_NAME}"

# Check if role exists
if ! aws iam get-role --role-name $ROLE_NAME > /dev/null 2>&1; then
    echo "Creating IAM role: $ROLE_NAME"
    
    # Create trust policy
    cat > /tmp/trust-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "bedrock-agentcore.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
EOF

    # Create role
    aws iam create-role \
        --role-name $ROLE_NAME \
        --assume-role-policy-document file:///tmp/trust-policy.json

    # Attach policies
    aws iam attach-role-policy \
        --role-name $ROLE_NAME \
        --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

    # Create custom policy for S3 and CloudWatch
    cat > /tmp/custom-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::${DATA_BUCKET}",
                "arn:aws:s3:::${DATA_BUCKET}/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "bedrock:Retrieve",
                "bedrock:RetrieveAndGenerate"
            ],
            "Resource": "arn:aws:bedrock:${AWS_REGION}:${AWS_ACCOUNT_ID}:knowledge-base/${KNOWLEDGE_BASE_ID}"
        },
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "arn:aws:logs:${AWS_REGION}:${AWS_ACCOUNT_ID}:*"
        }
    ]
}
EOF

    aws iam put-role-policy \
        --role-name $ROLE_NAME \
        --policy-name "AgentCoreCustomPolicy" \
        --policy-document file:///tmp/custom-policy.json

    # Wait for role to be ready
    echo "⏳ Waiting for IAM role to be ready..."
    sleep 10
fi

# Create BedrockAgentCore Runtime
echo "🤖 Creating BedrockAgentCore Runtime..."

# Check if runtime already exists
if aws bedrock-agentcore describe-runtime --runtime-id $RUNTIME_NAME --region $AWS_REGION > /dev/null 2>&1; then
    echo "Runtime already exists. Updating..."
    aws bedrock-agentcore update-runtime \
        --runtime-id $RUNTIME_NAME \
        --region $AWS_REGION \
        --runtime-configuration '{
            "imageUri": "'$AWS_ACCOUNT_ID'.dkr.ecr.'$AWS_REGION'.amazonaws.com/'$ECR_REPOSITORY':latest",
            "environment": {
                "MODEL_ID": "anthropic.claude-3-5-sonnet-20241022-v2:0",
                "TEMPERATURE": "0.7",
                "MAX_TOKENS": "4000",
                "TOP_P": "0.9",
                "DATA_BUCKET": "'$DATA_BUCKET'",
                "KNOWLEDGE_BASE_ID": "'$KNOWLEDGE_BASE_ID'",
                "LOG_LEVEL": "INFO"
            },
            "timeout": 30,
            "memorySize": 1024
        }' \
        --execution-role-arn $ROLE_ARN
else
    echo "Creating new runtime..."
    aws bedrock-agentcore create-runtime \
        --runtime-id $RUNTIME_NAME \
        --region $AWS_REGION \
        --description "AgentCore runtime for League of Legends match and champion analysis" \
        --runtime-configuration '{
            "imageUri": "'$AWS_ACCOUNT_ID'.dkr.ecr.'$AWS_REGION'.amazonaws.com/'$ECR_REPOSITORY':latest",
            "environment": {
                "MODEL_ID": "anthropic.claude-3-5-sonnet-20241022-v2:0",
                "TEMPERATURE": "0.7",
                "MAX_TOKENS": "4000",
                "TOP_P": "0.9",
                "DATA_BUCKET": "'$DATA_BUCKET'",
                "KNOWLEDGE_BASE_ID": "'$KNOWLEDGE_BASE_ID'",
                "LOG_LEVEL": "INFO"
            },
            "timeout": 30,
            "memorySize": 1024
        }' \
        --execution-role-arn $ROLE_ARN
fi

# Wait for runtime to be ready
echo "⏳ Waiting for runtime to be ready..."
aws bedrock-agentcore wait runtime-available --runtime-id $RUNTIME_NAME --region $AWS_REGION

# Get runtime endpoint
RUNTIME_ENDPOINT=$(aws bedrock-agentcore describe-runtime --runtime-id $RUNTIME_NAME --region $AWS_REGION --query 'runtime.endpoint' --output text)

echo "✅ BedrockAgentCore Runtime deployment completed successfully!"
echo ""
echo "📋 Runtime Details:"
echo "  Runtime ID: $RUNTIME_NAME"
echo "  Runtime Endpoint: $RUNTIME_ENDPOINT"
echo "  ECR Image: $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest"
echo ""
echo "🔗 Next steps:"
echo "1. Update your Lambda environment variables:"
echo "   AGENTCORE_RUNTIME_ID=$RUNTIME_NAME"
echo "   AGENTCORE_ENDPOINT=$RUNTIME_ENDPOINT"
echo "2. Test the chat interface in your application"
echo "3. Monitor runtime performance in CloudWatch"

# Cleanup temporary files
rm -f /tmp/trust-policy.json /tmp/custom-policy.json