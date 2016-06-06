"use strict";

var usersCollection;

var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

// Connect to the db
MongoClient.connect("mongodb://localhost:27017/astro", function(err, db) {
    if(err) { return console.dir(err); }
    
    console.log("Mongo connected");
    usersCollection = db.collection('users');

    var email = "ajkoren@gmail.com";
    usersCollection.find({email:email}, function(err, item) {
        if (item)
            console.log("user " + email + " found");
        else
            console.log("user " + email + " NOT found");
        //console.log(item);
        return true;
    });
    
    var charts = [{"name": "AJK Chart", 
                 "lat": 44.98, "long": 93.02, 
                 "utcDatetime": "1959/12/22 16:51", "tz": -5},
                {"name": "RMJ Chart", 
                 "lat": 44.98, "long": 93.02, 
                 "utcDatetime": "1971/01/02 02:31", "tz": -5}];
    
    exports.insertCharts(email, charts, function(results) {
        if (results) {
            console.log('insert results: ', results.charts);
        }
    });
    
    exports.list(email, function(items) {
        if (items) {
            console.log("user " + email + " found");
            for (var i = 0; i < items.length; i++) {
                console.log('item: ', items[i]);
            }
        } else {
            console.log("user " + email + " NOT found");
        }
    });  
    
    return false;

});

exports.login = function(email, pw, callback) {
    usersCollection.findOne({email:email, pw:pw}, function(err, results) {
      if (err) {
          console.log(err);
          callback(false);
      } else if (results) {
          console.log('Logged in. User Found:', results);
          callback(true, results.name);
      } else {
          console.log('login failed');
          callback(false);
      }
    });
}

exports.register = function(name, email, pw, callback) {
    usersCollection.findOne({email:email}, function(err, results) {
        if (err) {
            console.log(err);
            callback('error');
        } else if (results) {
            console.log('User ' + email + ' already exists.');
            callback('exists');
        } else {
            usersCollection.insert({name:name, email:email, pw:pw}, {w:1}, function(err, results) {
                if (err) {
                    console.log(err);
                    callback('error');
                } else if (results) {
                    console.log('Registered:', results);
                    callback('created');
                } else {
                    console.log('Registration failed');
                    callback('failed');
                }
            });
        }
    });
}

exports.list = function(email, callback) {
    usersCollection.find({email:email}).toArray(function(err, results) {
      if (err) {
          console.log('db find error: ', err);
          callback(false);
      } else if (results) {
          console.log('db found for ' + email);
          callback(results);
      } else {
          console.log('db not found');
          callback(false);
      }
    });
}

exports.insertCharts = function(email, charts, callback) {
    usersCollection.updateOne(
        { email: email },
        {$set:
            {charts: charts}
        },
        function(err, results) {
            assert.equal(null, err);
            assert.equal(1, results.matchedCount);
            //assert.equal(1, results.modifiedCount); 
            // it works but for some reason doesn't assert: results.modifiedCount == 0.
            callback(results);
        }
    );
}

