 /******************************************************
 * PLEASE DO NOT EDIT THIS FILE
 * the verification process may break
 * ***************************************************/

'use strict';

var fs = require('fs');
var express = require('express');
var app = express();
var mongodb = require('mongodb');

var uri = 'mongodb://'+process.env.DB_USER+':'+process.env.DB_PASS+'@'+process.env.DB_HOST+':'+process.env.DB_PORT+'/'+process.env.DB_NAME;

var MongoClient = mongodb.MongoClient;

if (!process.env.DISABLE_XORIGIN) {
  app.use(function(req, res, next) {
    var allowedOrigins = ['https://narrow-plane.gomix.me', 'https://www.freecodecamp.com'];
    var origin = req.headers.origin || '*';
    if(!process.env.XORIG_RESTRICT || allowedOrigins.indexOf(origin) > -1){
         console.log(origin);
         res.setHeader('Access-Control-Allow-Origin', origin);
         res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    }
    next();
  });
}

app.use('/public', express.static(process.cwd() + '/public'));

app.route('/_api/package.json')
  .get(function(req, res, next) {
    console.log('requested');
    fs.readFile(__dirname + '/package.json', function(err, data) {
      if(err) return next(err);
      res.type('txt').send(data.toString());
    });
  });

app.use('/latest-versions', function (req, res) {
  const latestVersion = require('latest-version');
 
  latestVersion('mongod').then(version => {
      console.log(version);
      //=> '0.18.0' 
  });

  latestVersion('mongodb').then(version => {
      console.log(version);
      //=> '1.0.1' 
  });  
  res.send('versions shown');
});

app.use('/db-connect', function(req, res) {
  console.log(process.env.DB_HOST);
  console.log(process.env.DB_PORT);
  console.log(process.env.DB_NAME);
  console.log(uri);
  console.log(process.env.DB_USER);
  console.log(process.env.DB_PASS);
  MongoClient.connect(uri, function(err, db) {
    if (err) { console.log('Unable to connect to server.'); }
    else { console.log('Connection established.'); }
  });
});

app.use('/db-insert-document', function(req, res) {
  MongoClient.connect(uri, function(err, db) {
    if (err) { console.log('Unable to connect to server.'); }
    else { 
      console.log('Connection established.'); 
      var docs = db.collection('url_collection');
      
      docs.insert({
                url: "https://www.microsoft.com",
        }, function(err, data) {
                if(err) throw err;
                else {
                  console.log('data inserted');
                  console.log(data);
                }
        });
    }
    db.close();
  });  
});

app.use('/db-find-document', function(req, res) {
  MongoClient.connect(uri, function(err, db) {
    if (err) { console.log('Unable to connect to server.'); }
    else { 
      console.log('Connection established.'); 
      var docs = db.collection('url_collection');
      
      docs.find({
                url: "https://www.microsoft.com",
        }).toArray(function(err, documents) {
                if(err) throw err;
                else {
                  console.log('data found');
                  console.log(documents);
                }
        });
    }
    db.close();
  });  
});

// For inserting the url in the collection
app.use('/new/:url_value*?', function(req, res) {
  console.log('current value: ' +req.params.url_value+req.params[0]);    // This retrieves both 'https:' and '<url_val>'
  console.log(Math.floor(1000 + Math.random() * 9000));                  // This retrieves a 4-digit random value
  res.send('url_value is a url string');
  
  // Start of mongodb call
  MongoClient.connect(uri, function(err, db) {
    if (err) { console.log('Unable to connect to server.'); }
    else {
      console.log('Connection established.'); 
      var docs = db.collection('url_collection');
  // Find method - check if url and url number values are unique
      docs.distinct({
        "url": {},
      }).toArray(function(err, documents) {
              if(err) throw err;
              else {
                console.log('data found');
                console.log(documents);
              }
      });
  // Insertion method next up to be placed below
    }
    db.close();
  });
  // End of mongodb call
  
});
  
app.route('/')
    .get(function(req, res) {
		  res.sendFile(process.cwd() + '/views/index.html');
    })

// Respond not found to all the wrong routes
app.use(function(req, res, next){
  res.status(404);
  res.type('txt').send('Not found');
});

// Error Middleware
app.use(function(err, req, res, next) {
  if(err) {
    res.status(err.status || 500)
      .type('txt')
      .send(err.message || 'SERVER ERROR');
  }  
})

app.listen(process.env.PORT, function () {
  console.log('Node.js listening ...');
});

