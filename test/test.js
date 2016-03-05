var assert = require('assert');
var MSPassportStrategy = require("../lib/index");

describe('MSPassportStrategy', function() {
  describe('#constructor()', function () {
    it('should set name to "mspassport"', function () {
      var strategy = new MSPassportStrategy();
      assert.equal("mspassport", strategy.name);
    });
  });
  describe('#authenticate', function() {
      it('request with no signature should return 401 with a challenge', function(){
          var strategy = new MSPassportStrategy({
              protocol : "http-auth-header"
          });
          strategy.fail = function(description, status) {
            assert.equal(401, status);
            assert.equal(0, description.lastIndexOf("MSPassport", 0), "auth header should start with 'MSPassport'");  
          };
          var req = {
              headers : {
                  authorization : 'MSPassport public_key="adfADFAFf234faDF/234fdsf+sd555=='
              }
          };
          strategy.authenticate(req);
          assert(req.mspassport.challenge, 'should have set req.mspassport.challenge');
      });
  });
});