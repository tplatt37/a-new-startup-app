var os = require("os");
var hostname = os.hostname();
var machinetype = os.machine();

var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');

var fs = require('fs');
var log_file = fs.createWriteStream(__dirname + '/a-new-startup-debug.log', {flags : 'w'});
var util = require('util');
var log_stdout = process.stdout;

// Log to a file also - makes it easier to troubleshoot load balanced instances. 
console.log = function(d) { //
  log_file.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
};

var AWS = null

// Set an Environment Var XRAY to "ON" to enable X-Ray traces, annotations, and metadata
// NOTE: To gather X-RAY data you must be running the X-Ray Daemon locally. 
// The code will also need xray: permissions via IAM.
// https://docs.aws.amazon.com/xray/latest/devguide/xray-daemon.html
var AWSXRay = null
if ( process.env.XRAY == "ON" )
{
    console.log("XRAY ON")
    AWSXRay = require('aws-xray-sdk');
    // Capture all AWS calls.
    AWS = AWSXRay.captureAWS(require('aws-sdk'));
}
else
{
    console.log("XRAY OFF")
    AWS = require('aws-sdk');
}

AWS.config.region = process.env.REGION

var sns = new AWS.SNS();
var ddb = new AWS.DynamoDB();

console.log("NodeJS Version=" + process.version )
console.log("hostname=" + os.hostname )
console.log("os.machine() function=" + typeof os.machine )
console.log("os.machine()=" + os.machine() )

var ddbTable =  process.env.APP_TABLE_NAME;
console.log("Using ddbTable=" + process.env.APP_TABLE_NAME )

// This is an ARN !
var snsTopic =  process.env.APP_TOPIC_ARN;
console.log("using snsTopic=" + process.env.APP_TOPIC_ARN )
if ( typeof snsTopic === "undefined" ) {
    console.log("snsTopic ARN is not set - no messages will be published.")
}

var app = express();

if ( process.env.XRAY == "ON") {
    app.use(AWSXRay.express.openSegment('a-new-startup-segment'));
}

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(bodyParser.urlencoded({extended:false}));

app.use('/static', express.static(path.join(__dirname, 'static')))

app.get('/', function(req, res) {
    console.log("rendering /...");
    res.render('index', {
        static_path: 'static',
        theme: process.env.THEME || 'flatly',
        flask_debug: process.env.FLASK_DEBUG || 'false',
        hostinfo: hostname,
        arch: machinetype,
        ddb_table: process.env.APP_TABLE_NAME || 'Not set!'
    });
});

app.post('/signup', function(req, res) {
    var item = {
        'email': {'S': req.body.email},
        'name': {'S': req.body.name},
        'preview': {'S': req.body.previewAccess},
        'theme': {'S': req.body.theme}
    };

    console.log(item);

    // Example of adding Annotation and Metadata to a segment via X-Ray
    if ( process.env.XRAY == "ON") {
        var seg = AWSXRay.getSegment();
        // Annotations are indexed - you can filter with: annotations.email = "test@example.com"
        seg.addAnnotation('email', req.body.email);
        seg.addAnnotation('name', req.body.name);
        seg.addAnnotation('preview', req.body.previewAccess);
        seg.addAnnotation('theme', req.body.theme);
    
        // Metadata is not indexed.
        seg.addMetadata('email', req.body.email, "optional-namespace");
        seg.addMetadata('name', req.body.name, "optional-namespace");
        seg.addMetadata('preview', req.body.previewAccess, "optional-namespace");
        seg.addMetadata('theme', req.body.theme, "optional-namespace");
    }

    ddb.putItem({
        'TableName': ddbTable,
        'Item': item,
        'Expected': { email: { Exists: false } }        
    }, function(err, data) {
        if (err) {
            var returnStatus = 500;

            if (err.code === 'ConditionalCheckFailedException') {
                returnStatus = 409;
            }

            res.status(returnStatus).end();
            console.log('DDB Error: ' + err);
        } else {
            if ( typeof snsTopic === "undefined" ) {
                console.log("No snsTopic defined... skipping publish.")
                res.status(201).end();
            } else {
                sns.publish({
                    'Message': 'Name: ' + req.body.name + "\r\nEmail: " + req.body.email 
                                        + "\r\nPreviewAccess: " + req.body.previewAccess 
                                        + "\r\nTheme: " + req.body.theme,
                    'Subject': 'New user sign up!!!',
                    'TopicArn': snsTopic
                }, function(err, data) {
                    if (err) {
                        res.status(500).end();
                        console.log('SNS Error: ' + err);
                    } else {
                        res.status(201).end();
                    }
                });
            }
        }
    });
});

app.get('*', function(req, res) {
    console.log("Unknown route...");
    console.log(req);
    res.send('Unknown route???', 404);
});

if ( process.env.XRAY == "ON") {
    app.use(AWSXRay.express.closeSegment());
}

module.exports = app;