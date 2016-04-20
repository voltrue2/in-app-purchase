'use strict';

var enabled = false;

module.exports.setup = function (config) {
	enabled = (config && config.verbose === true) ? true : false;
};

module.exports.log = function () {
	if (!enabled) {
		return;
	}
	var logs = [];
	logs.push('[' + Date.now() + '][VERBOSE]');
	for (var i in arguments) {
		logs.push(arguments[i]);
	}
	console.log.apply(console, logs);
};
