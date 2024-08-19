# A-New-Startup Sample App for AWS Demos

This is a simple, yet realistic, demo application meant for use with various AWS services. 

This app is based off of the Elastic Beanstalk Express Sample App: https://github.com/aws-samples/eb-node-express-sample

It is a simple app, but has enough complexity to show off DevOps services and techniques.

For example, it requires a DynamoDB table, an SNS Topic (OPTIONAL), and includes unit-tests (via Jest)

This version is compatible with multiple deployment methods, including:
* EC2 (via CodeDeploy or User Data)
* AWS Elastic Beanstalk (includes .ebextensions folder)
* Containers (includes Dockerfile)
...
and more

It uses NodeJS, Express, Bootstrap, so the tech stack resembles that of many modern web apps.

# Requirements

You need:
* AWS CLI v2
* NodeJS 18.9.* (os.machine() call is required)
* Docker - if you want to build a container image.

# What the App Does
This sample application uses the [Express](https://expressjs.com/) framework and [Bootstrap](http://getbootstrap.com/) to build a simple, scalable customer signup form that is deployed to [AWS Elastic Beanstalk](http://aws.amazon.com/elasticbeanstalk/) (or EC2 or as a Container, etc.). The application stores data in [Amazon DynamoDB](http://aws.amazon.com/dynamodb/) and publishes notifications to the [Amazon Simple Notification Service (SNS)](http://aws.amazon.com/sns/) when a customer fills out the form.

The app is a simple sign-up page.  The user can submit their email address, and it will be stored in the DynamoDB table.

The code will also publish a message about the signup to an SNS Topic *if* a Topic ARN is provided via Environment variable (APP_TOPIC_ARN)

Further, if you set XRAY=ON environment variable, X-Ray telemetry will be generated. (You must install the X-Ray daemon or run it as a container sidecar, of course)

Here's the home page of the app:

![Screen shot - A-New-Startup home page](/diagrams/a-new-startup-home-page.png)

The user can submit their e-mail address...
![Screen shot - A-New-Startup Email Form](/diagrams/a-new-startup-form.png)

Their details will be stored in a DynamoDB table ("Signups") and a message will be sent to an SNS topic...

![Screen shot - A-New-Startup home page](/diagrams/a-new-startup-form-submitted.png)


# Running a local build

Let's get it running on a local machine, or maybe Cloud9 (NodeJS 16 is required):

1. Git clone this repo
2. First, You'll need to create the backend services (DDB, SNS, SQS) via CloudFormation:
```
aws cloudformation deploy --template-file template-static-names.yaml --stack-name "a-new-startup-dev"
```
2. Install dependencies:
```
npm install
```
3. Run unit tests
```
npm run test
```
4. Set three simple environment variables (to point the code to the database and topic). Please note that you must REPLACE the actual topic ARN below (It's one of the stack outputs).
 Replace the REGION as appropriate as well.
```
export REGION=us-east-1
export APP_TABLE_NAME=a-new-startup-dev
export APP_TOPIC_ARN=(ARN for the topic created by the CFN template)
```
If you want to be fancy, pull those values dynamically from IMDS (REGION) and the Stack Outputs via command substitution:

```
export REGION=${AWS_DEFAULT_REGION:-$(curl http://169.254.169.254/latest/dynamic/instance-identity/document|grep region|awk -F\" '{print $4}')}
export APP_TABLE_NAME=$(aws cloudformation describe-stacks --stack-name "a-new-startup-dev" --query "Stacks[0].Outputs[?OutputKey=='TableName'].OutputValue" --output text)
export APP_TOPIC_ARN=$(aws cloudformation describe-stacks --stack-name "a-new-startup-dev" --query "Stacks[0].Outputs[?OutputKey=='TopicArn'].OutputValue" --output text)
```

5. Run the application:
```
npm start
```

The app will then be up and running.  

If you are using Cloud9, go to "Preview" -> "Preview Running Application".

Can it write to the database? It should be able to, assuming the Profile you are running with has sufficient permissions.

# Run as a Container

There's two scripts that make it easy to build/run via Docker:

Run this command to deploy the CloudFormation resources (DDB table, SNS Topic)
```
./01-create-iac.sh
```

Run this command to docker build / docker run
```
./02-build-and-run-container.sh
```

You can then open http://localhost:8080 (or "Preview Running Application" in Cloud9) to see the app.

# CI/CD 

Here's some CI/CD examples that deploy A-New-Startup in a variety of ways:

EC2 - Using an Application Load Balancer, Launch Template, and Auto Scaling Group). The app is deployed via CodeDeploy:
https://github.com/tplatt37/a-new-startup-pipeline-demo

ECS - We build a container image via the included Dockerfile, store it in ECR, then deploy to an ECS Service using CloudFormation:
https://github.com/tplatt37/a-new-startup-ecs-demo

EKS - Can we run as a Pod on a k8s cluster? Yep - this example will create a complete pipeline and deploy via Helm:
https://github.com/tplatt37/a-new-startup-eks-cicd

NOTE: For the above, I assume you already have an EKS cluster available. If you don't ... why not use the:
https://github.com/tplatt37/eks-cluster-creator

The above will create an EKS cluster with the AWS Load Balancer Controller, which is basically what is needed for the app to run on k8s.

# Other things...

By settings environment variable XRAY to ON , the code will run with X-Ray tracing.  You must ensure that the X-Ray Daemon is running appropriately though.  The EKS example above runs the X-Ray daemon as a sidecar in the Pod containing the App.