var async = require('async');

var apple = require('./lib/apple');
var google = require('./lib/google');
var windows = require('./lib/windows');
var constants = require('./constants');

module.exports.APPLE = constants.SERVICES.APPLE;
module.exports.GOOGLE = constants.SERVICES.GOOGLE;
module.exports.WINDOWS = constants.SERVICES.WINDOWS;

module.exports.config = function (configIn) {
	apple.readConfig(configIn);
	google.readConfig(configIn);
};

module.exports.setup = function (cb) {
	async.parallel([
		function (next) {
			apple.setup(next);
		},
		function (next) {
			google.setup(next);
		}
	], cb);
};

module.exports.validate = function (service, receipt, cb) {
	var validator;
	switch (service) {
		case module.exports.APPLE:
			validator = apple.validatePurchase;
			break;
		case module.exports.GOOGLE:
			validator = google.validatePurchase;
			break;
		case module.exports.WINDOWS:
			validator = windows.validatePurchase;
			break;
		default:
			return cb(new Error('invalid service given: ' + service));
	}
	validator(receipt, function (error, response) {
		if (error) {
			return cb(error);
		}
		cb(null, response);
	});
};

module.exports.isValidated = function (response) {
	if (response && response.status === constants.VALIDATION.SUCCESS) {
		return true;
	}
	return false;
};

module.exports.getPurchaseData = function (purchaseData) {
	if (!purchaseData || !purchaseData.service) {
		return null;
	}
	var data = {};
	switch (purchaseData.service) {
		case constants.SERVICES.APPLE:
			return apple.getPurchaseData(purchaseData);
		case constants.SERVICES.GOOGLE:
			return google.getPurchaseData(purchaseData);
		case constants.SERVICES.WINDOWS:
			return windows.getPurchaseData(purchaseData);
		default:
			return null;
	}
};

// test use only
module.exports.reset = function () {
	// resets google setup
	google.reset();
};
