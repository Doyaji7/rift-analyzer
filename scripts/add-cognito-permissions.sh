#!/bin/bash

# Cognito Identity Pool 역할에 AgentCore 권한 추가

ROLE_NAME="riot-agentcore-cognito"
POLICY_NAME="AgentCoreInvokePolicy"
AGENTCORE_RUNTIME_ARN="arn:aws:bedrock-agentcore:us-east-1:661893373836:runtime/riot_data_analyzer-pE01nfE4X0"

echo "Adding AgentCore invoke permission to role: $ROLE_NAME"

# Policy document 생성
cat > /tmp/agentcore-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock-agentcore:InvokeAgentRuntime"
      ],
      "Resource": "$AGENTCORE_RUNTIME_ARN"
    }
  ]
}
EOF

# Inline policy 추가
aws iam put-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-name "$POLICY_NAME" \
  --policy-document file:///tmp/agentcore-policy.json

if [ $? -eq 0 ]; then
  echo "✅ Permission added successfully!"
  echo ""
  echo "Policy added to role: $ROLE_NAME"
  echo "Allowed action: bedrock-agentcore:InvokeAgentRuntime"
  echo "Resource: $AGENTCORE_RUNTIME_ARN"
else
  echo "❌ Failed to add permission"
  exit 1
fi

# Cleanup
rm /tmp/agentcore-policy.json
