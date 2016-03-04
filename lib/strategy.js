;((function(){
var util = require("util"), 
    crypto = require("crypto"),
    Strategy = require("passport-strategy");

/**
 * Merges default options with actual options
 *
 * @param {Object} defaults The default options
 * @param {Object} options The set options
 * @api private
 */
var _defaults = function(defaults, options) {
    options = options || {};
    for (var option in defaults) {
        if (defaults.hasOwnProperty(option) && !options.hasOwnProperty(option)) {
            options[option] = defaults[option];
        }
    }
    
    return options;
};

/**
 * Verify signature
 *
 * @param {Object} pk The public key
 * @param {Object} challenge The challenge
 * @param {Object} signature The signed challenge
 * @api private
 */
var _verifySignature = function(pk, challenge, signature) {
    var pem = "-----BEGIN RSA PUBLIC KEY-----\n" 
        + pk.replace(/(.{64})/g, "$1\n")
        + "\n-----END RSA PUBLIC KEY-----";

    var rsa = crypto.createVerify("RSA-SHA256");
    rsa.update(new Buffer(challenge, "base64"));
    if(rsa.verify(pem, signature, "base64"))
    {
        return { result : true };
    }
    else {
        return { result : false };
    }
};

var _challenge = function(req, options) {
    options = options || {};
    var nonce_size = options.hasOwnProperty("nonce_size") ? options.nonce_size : 32;
  
    var mac = crypto.createHash('sha256');
    var nonce = crypto.randomBytes(nonce_size);
    mac.update(nonce);
    mac.update(Date.now().toString());
    
    req.mspassport.challenge = mac.digest('base64');
};

var _protocol_query = function(req, callback) {
  callback({
      public_key : decodeURIComponent(req.query.public_key),
      challenge : decodeURIComponent(req.query.challenge),
      signature : decodeURIComponent(req.query.signature)
  });
};

var _protocol_header = function(req, callback) {
    var authHeader = req.headers.authorization;
    console.log("authHeader = " + authHeader);
    
  callback({
        public_key : "pk",
        challenge : "foo",
        signature : "foo-signed"  
  });
};

var _protocol_json = function(req, callback) {
    callback({ 
        public_key : req.body.public_key,
        challenge : req.body.challenge,
        signature : req.body.signature
    });
};

/**
 * Creates an instance of `MSPassportStrategy`.
 *
 * @constructor
 * @api public
 */
function MSPassportStrategy(options) {
  Strategy.call(this);
  this.name = "mspassport";
  
  var default_options = {
        protocol : "querystring",
        protocolHandler : function() { self.fail("protocolHandler must be implemented if protocol === 'custom'") }        
  };
    
  this.options = _defaults(default_options, options);
}

util.inherits(MSPassportStrategy, Strategy);

/**
 * Authenticate request.
 *
 * This function must be overridden by subclasses.  In abstract form, it always
 * throws an exception.
 *
 * @param {Object} req The request to authenticate.
 * @param {Object} [options] Strategy-specific options.
 * @api public
 */
MSPassportStrategy.prototype.authenticate = function(req, options) {
    var self = this;
    
    //merge strategy level options with function level options
    var opts = _defaults(this.options, options);
    console.log(opts);
    
    req.mspassport = {
        authenticated : false
    };
    
    switch (opts.protocol) {
        case "http-auth-header":
            opts.protocolHandler = _protocol_header;
            break;
        case "querystring":
            opts.protocolHandler = _protocol_query;
            break;
        case "json":
            opts.protocolHandler = _protocol_json;
            break;
        case "custom":
            //use the protocol handler passed in
            break;
        default:
            return self.error("invalid protocolHandler");
    };
    
    opts.protocolHandler(req, function(parameters){
        if(parameters.signature) {
            console.log("verification challenge received");
            console.log(parameters);
            var result = _verifySignature(parameters.public_key, parameters.challenge, parameters.signature);
            if (result.success) {
                opts.findUserByPublicKey(parameters.public_key, function(user){
                    if(user) {
                        self.success(user);
                    } else {
                        //todo: what to do if user not found in db.
                        self.error("user not found with that public key");
                    }
                });
            } else {
                self.error("signature validation failed");
            }
        } else {
            _challenge(req);
            console.log("issuing challenge " + req.mspassport.challenge);
            self.fail("MSPassport challenge=\"" + req.mspassport.challenge + "\"", 401);
        }
    });    
};

/** 
* Expose `Strategy`. 
*/
module.exports = MSPassportStrategy;

})());