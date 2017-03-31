var async = require('./lib/async');

var apple = require('./lib/apple');
var google = require('./lib/google');
var windows = require('./lib/windows');
var amazonManager = require('./lib/amazonManager');
var constants = require('./constants');
var verbose = require('./lib/verbose');

var amazon;

module.exports.APPLE = constants.SERVICES.APPLE;
module.exports.GOOGLE = constants.SERVICES.GOOGLE;
module.exports.WINDOWS = constants.SERVICES.WINDOWS;
module.exports.AMAZON = constants.SERVICES.AMAZON;

module.exports.config = function (configIn) {
	apple.readConfig(configIn);
	google.readConfig(configIn);
	windows.readConfig(configIn);
	amazon = amazonManager.create(configIn);
	verbose.setup(configIn);
};

module.exports.setup = function (cb) {
	async.parallel([
		function (next) {
			apple.setup(next);
		},
		function (next) {
			google.setup(next);
		},
		function (next) {
			amazon.setup(next);
		}
	], cb);
};

module.exports.validate = function (service, receipt, cb) {
	switch (service) {
		case module.exports.APPLE:
			apple.validatePurchase(null, receipt, cb);
			break;
		case module.exports.GOOGLE:
			google.validatePurchase(null, receipt, cb);
			break;
		case module.exports.WINDOWS:
			windows.validatePurchase(receipt, cb);
			break;
		case module.exports.AMAZON:
			amazon.validatePurchase(null, receipt, cb);
			break;
		default:
			return cb(new Error('invalid service given: ' + service));
	}
};

module.exports.validateOnce = function (service, secretOrPubKey, receipt, cb) {
	
	if (!secretOrPubKey && service !== module.exports.APPLE && service !== module.exports.WINDOWS) {
		verbose.log('<.validateOnce>', service, receipt);
		return cb(new Error('missing secret or public key for dynamic validation:' + service));
	}
	
	switch (service) {
		case module.exports.APPLE:
			apple.validatePurchase(secretOrPubKey, receipt, cb);
			break;
		case module.exports.GOOGLE:
			google.validatePurchase(secretOrPubKey, receipt, cb);
			break;
		case module.exports.WINDOWS:
			windows.validatePurchase(receipt, cb);
			break;
		case module.exports.AMAZON:
			amazon.validatePurchase(secretOrPubKey, receipt, cb);
			break;
		default:
			verbose.log('<.validateOnce>', secretOrPubKey, receipt);
			return cb(new Error('invalid service given: ' + service));
	}
};

module.exports.isValidated = function (response) {
	if (response && response.status === constants.VALIDATION.SUCCESS) {
		return true;
	}
	return false;
};

module.exports.isExpired = function (purchasedItem) {
	if (!purchasedItem || !purchasedItem.transactionId) {
		throw new Error('invalid purchased item given:\n' + JSON.stringify(purchasedItem));
	}
	if (purchasedItem.cancellationDate) {
		// it has been cancelled
		return true;
	}
	if (!purchasedItem.expirationDate) {
		// there is no exipiration date with this item
		return false;
	}
	if (Date.now() - purchasedItem.expirationDate >= 0) {
		return true;
	}
	// has not exipired yet
	return false;
};

module.exports.getPurchaseData = function (purchaseData, options) {
	if (!purchaseData || !purchaseData.service) {
		return null;
	}
	switch (purchaseData.service) {
		case module.exports.APPLE:
			return apple.getPurchaseData(purchaseData, options);
		case module.exports.GOOGLE:
			return google.getPurchaseData(purchaseData, options);
		case module.exports.WINDOWS:
			return windows.getPurchaseData(purchaseData, options);
		case module.exports.AMAZON:
			return amazon.getPurchaseData(purchaseData, options);
		default:
			return null;
	}
};

module.exports.refreshGoogleToken = function (cb) {
	
	google.refreshToken(cb);

};

// test use only
module.exports.reset = function () {
	// resets google setup
	google.reset();
};
