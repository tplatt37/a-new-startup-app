#!/bin/bash

echo "Version 3.0 Server"

# If no arguments passed in, assume CodeDeploy has set $DEPLOYMENT_GROUP_NAME, which must be the environment name
# Otherwise, we're using the argument passed in.
# We're expecting "dev" as the deployment_group_name...
if [[ $# -eq 0  ]]; then
    export ENVIRONMENT=$DEPLOYMENT_GROUP_NAME
else
    export ENVIRONMENT=$1
fi
echo $ENVIRONMENT

# As far as Node is concerned, we're always running in production
export NODE_ENV=production
echo $NODE_ENV

# Get a token so we can invoke IMDS v2
TOKEN=`curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 600"`

# Get the region from AWS_DEFAULT_REGION, but if that's not set , pull it from IMDSv2
export REGION=${AWS_DEFAULT_REGION:-$(curl -H "X-aws-ec2-metadata-token: $TOKEN" -v http://169.254.169.254/latest/dynamic/instance-identity/document | grep region|awk -F\" '{print $4}')}
echo $REGION

# Figure out which DynamoDB table we are using, which SNS topic, and for what account.
export APP_TABLE_NAME=$(aws ssm get-parameters --region $REGION --names /a-new-startup/$ENVIRONMENT/tablename --with-decryption --query 'Parameters[0].Value' --output text)
echo $APP_TABLE_NAME

export APP_TOPIC_ARN=$(aws ssm get-parameters --region $REGION --names /a-new-startup/$ENVIRONMENT/topicarn --with-decryption --query 'Parameters[0].Value' --output text)
echo $APP_TOPIC_ARN

export AWS_ACCOUNT=$(aws ssm get-parameters --region $REGION --names /a-new-startup/$ENVIRONMENT/aws-account --with-decryption --query 'Parameters[0].Value' --output text)
echo $AWS_ACCOUNT

# X-Ray is turned on by default. UserData should have set up the agent to be running.
export XRAY="ON"

#
# Install a systemd service unit so that a-new-startup will be running when we reboot.
#

# For troubleshooting: make sure these things exist...
#
# NodeJS 18 should have been installed via User Data (or some method)
# We don't do that during CodeDeploy deployment for reliability and speed.
# (installing packages can fail randomly - see EC2 UserData section in compute.yaml)
#
which /usr/bin/node
/usr/bin/node -v
ls -lha /home/ec2-user/node-website/src/server.js
cat /home/ec2-user/node-website/src/server.js

cat << EoF > /lib/systemd/system/a-new-startup.service
[Unit]
Description=a-new-startup
After=network.target

[Service]
Environment=NODE_PORT=3000
Environment=APP_TABLE_NAME=$APP_TABLE_NAME
Environment=APP_TOPIC_ARN=$APP_TOPIC_ARN
Environment=AWS_ACCOUNT=$AWS_ACCOUNT
Environment=REGION=$REGION
Environment=XRAY=ON
Type=simple
User=root
ExecStart=/usr/bin/node /home/ec2-user/node-website/src/server.js
Restart=always
StartLimitIntervalSec=0

[Install]
WantedBy=multi-user.target
EoF

# This makes it a service that will start now and will start on reboot.
systemctl enable --now --output verbose a-new-startup.service

echo "Waiting for start..."
sleep 10

systemctl status a-new-startup.service
# Exit with whatever systemctl status returns 
exit $?