#!/bin/bash

#
# Here's how to build and run this as a container 
# 
#

# NOTE: Did you create the backend infra?   

REGION=${AWS_DEFAULT_REGION:-$(aws configure get default.region)}
echo "REGION=$REGION"

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "ACCOUNT_ID=$ACCOUNT_ID"

docker build -t a-new-startup . 

docker run \
  -p 8080:3000 \
  --env REGION=$REGION \
  --env APP_TABLE_NAME=a-new-startup-dev \
  --env APP_TOPIC_ARN=arn:aws:sns:$REGION:$ACCOUNT_ID:a-new-startup-dev \
  --env XRAY=ON \
  a-new-startup:latest

# You should now be able to pull up http://localhost:8080 to see the app (or Preview Running Application on Cloud9)