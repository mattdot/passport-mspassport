var express = require("express");
var bodyParser = require('body-parser');
var passport = require("passport");
//var mspassport = require("passport-mspassport");
var mspassport = require("../../../lib/index");
var UserDB = require("./users");
var MSPassportStrategy = mspassport.Strategy;

// a simple in-memory db of users.  For example only, 
// use a real database to store your data!
var users = new UserDB([
    {
        "preferredUserName" : "mattdot",
        "displayName" : "Matt Dotson",
        "credentials" : {
            "password" : "super_secret",
            "keys" : ["1234567890"]
        }
    }
]);

var app = express();
app.use(bodyParser.json());

// configure passport to use the MSPassportStrategy
passport.use("mspassport", new MSPassportStrategy({
    protocol: "http-auth-header",
    protocolHandler: function (req, callback) {
        //get the public key for this request.  If it's part of the
        //HTTP request, then get it from the header/querystring/body.
        //If it's stored in a db and the request has a username, look
        //up the public key from there.
        callback({
            publicKey: "pk",
            challenge: "challenge",
            signature: null
        });
    },
    findUserByPublicKey: function (key, callback) {
        users.findUserByPublicKey(key, function(user) {
            callback({
                "id" : user.id,
                "displayName" : user.displayName,
                "preferredUserName" : user.preferredUserName
            });
        });
    }
}));

app.get("/", function(req,res){
    res.write("hello passport");
    res.end();
});

app.put("/register", function(req, res) {
    console.log(req.body);
    res.json(req.body);
});

//app.get("/auth/mspassport/challenge", passport.challenge("mspassport"), function (req, res) {
//    res.json(req.mspassport);
//});

app.post("/auth/mspassport", passport.authorize("mspassport"), function (req, res) {
    console.log("auth request");
    res.json(req.mspassport);
});

var port = process.env.PORT || 1339;
app.listen(port, function() {
    console.log("listening for requests on port %d", port);
})