#!/bin/bash

#
# Wait up to 60 seconds for node application to be listening on port 3000 
# 

MAX_ATTEMPTS=12
attempt_num=1

while [[ $attempt_num -le $MAX_ATTEMPTS ]]; do
  curl localhost:3000 &> /dev/null
  
  if [ $? -eq 0 ]; then
    echo "Successfully connected to port 3000"
    exit 0
  else
    echo "Connection failed. Retrying..."   
    attempt_num=$((attempt_num+1)) 
    sleep 5
  fi
done  

echo "Could not connect to port 3000 after $MAX_ATTEMPTS attempts. Exiting..."
systemctl status a-new-startup.service
exit 1