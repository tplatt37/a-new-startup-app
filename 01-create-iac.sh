#!/bin/bash

# Run this to create backend infra (DDB table, SNS Topic)

aws cloudformation deploy \
  --template-file template-static-names.yaml \
  --stack-name a-new-startup-dev \
  --capabilities CAPABILITY_NAMED_IAM  
