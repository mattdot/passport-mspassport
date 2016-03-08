# passport-mspassport
[![Build Status](https://travis-ci.org/mattdot/passport-mspassport.svg?branch=master)](https://travis-ci.org/mattdot/passport-mspassport)

[PassportJS](http://passportjs.org/) strategy for authenticating with [Microsoft Passport](https://technet.microsoft.com/en-us/library/dn985839%28v=vs.85%29.aspx) and [Windows Hello](http://windows.microsoft.com/en-us/windows-10/getstarted-what-is-hello).

This module lets you authenticate using Microsoft Passport in your Node.js applications.

## Install

    $ npm install passport-mspassport

## Usage

#### Configure Strategy

```js
// configure passport to use the MSPassportStrategy
passport.use("mspassport", new MSPassportStrategy({
    protocol: "custom",
    protocolHandler: function (req, callback) {
        //get the public key for this request.  If it's part of the
        //HTTP request, then get it from the header/querystring/body.
        //If it's stored in a db and the request has a username, look
        //up the public key from there.
        callback({
            publicKey: "",
            challenge: "",
            signature: ""
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
```

#### Authenticate Requests

Use `passport.authenticate()`, specifying the `'mspassport'` strategy, to
authenticate requests.

For example, as route middleware in an [Express](http://expressjs.com/)
application:

```js
app.get('/auth/mspassport', passport.authenticate('mspassport'));
```
