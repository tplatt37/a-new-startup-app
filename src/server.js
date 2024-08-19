const app = require("./app")

var port = process.env.PORT || 3000;

server = app.listen(port, function () {
    var port = server.address().port;
    console.log('A-New-Startup app listening at port %s', port);
});

// Graceful shutdown requested
process.on('SIGTERM', () => {
  console.info('SIGTERM signal received.');
  process.exit(0);
});