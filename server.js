const http = require('http');
const mongoose = require("mongoose")
const config = require("./config")
const Api = require("./api")
const feeds = require("./feeds")
const Boxscore = require('./models')

const hostname = '127.0.0.1';
const port = 8080;

function startDb() {
  mongoose.connect(config.db);
  mongoose.connection.on("error", function(err) {
      console.log(err);
  })
}

startDb()

const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const url = req.url;
    const gameId = url.split("/")[1]
    const feedUrl = feeds[gameId]

    if (typeof feedUrl !== 'undefined') {
        Api.getLatestBoxscore(gameId)
          .then(feed => {
              res.write(JSON.stringify(feed));
              res.end();
          })
    } else if (url === "/reset") {
        Boxscore.remove({}, function(){})
        res.write(JSON.stringify("Reset db."));
        res.end();
    } else {
        res.statusCode = 500
        res.setHeader('Content-Type', 'text/html');
        res.write('<h1>That feed does not exist.<h1>');
        res.end();
    }


});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
