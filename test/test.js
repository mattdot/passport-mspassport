var assert = require('assert');
var MSPassportStrategy = require("../lib/index");

describe('MSPassportStrategy', function() {
  describe('#constructor()', function () {
    it('should set name to "mspassport"', function () {
      var strategy = new MSPassportStrategy();
      assert.equal("mspassport", strategy.name);
    });
  });
});