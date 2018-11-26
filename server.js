const http = require('http');
const mongoose = require("mongoose")
const config = require("./config")
const Api = require("./api")

const hostname = '127.0.0.1';
const port = 3000;

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
  var url = req.url;
  if(url ==='/game1'){
    Api.getLatestBoxscore("1")
        .then(feed => {
            res.write(JSON.stringify(feed));
            res.end();
        })


  } else if (url ==='/game2'){
    const data = Api.getLatestBoxscore("2")
    res.write('<h1>Get boxscore for game two<h1>');
    res.end();
  } else {
    res.statusCode = 404
    res.write('<h1>Page not found!<h1>');
    res.end();
  }
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
