'use strict';

var amazon = require('./amazon');
var amazon2 = require('./amazon2');

module.exports.create = function (_config) {
	if (_config && _config.amazonAPIVersion === 2) {
		amazon2.readConfig(_config);
		return amazon2;
	} else {
		amazon.readConfig(_config);
		return amazon;
	}
};
