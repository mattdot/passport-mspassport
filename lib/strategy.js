var util = require("util"), 
    Strategy = require("passport-strategy");

function MSPassportStrategy(options) {
  Strategy.call(this);
}

util.inherits(MSPassportStrategy, Strategy);

MSPassportStrategy.prototype.authenticate = function(req, options) {
  // TODO: authenticate request
}

exports.Strategy = MSPassportStrategy;