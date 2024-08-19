//These aren't really required, because the unit tests don't connect to these resources
// But this is how you'd set any ENV vars you need for unit testing.
process.env.APP_TABLE_NAME = "a-new-startup-dev"
process.env.REGION = "us-west-2"
process.env.APP_TOPIC_ARN = "arn:aws:sns:us-west-2:999999999999:a-new-startup-dev"
process.env.AWS_ACCOUNT = "999999999999"