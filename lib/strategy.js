var util = require("util"), 
    Strategy = require("passport-strategy");

/**
 * Creates an instance of `MSPassportStrategy`.
 *
 * @constructor
 * @api public
 */
function MSPassportStrategy(options) {
  Strategy.call(this);
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
  // TODO: authenticate request
}

/** 
* Expose `Strategy`. 
*/
28 module.exports = MSPassportStrategy;