var async = require('./lib/async');

var apple = require('./lib/apple');
var google = require('./lib/google');
var windows = require('./lib/windows');
//var amazon = require('./lib/amazon2');
var amazon = require('./lib/amazon');
var constants = require('./constants');
var verbose = require('./lib/verbose');

var self = module.exports;
module.exports.APPLE = constants.SERVICES.APPLE;
module.exports.GOOGLE = constants.SERVICES.GOOGLE;
module.exports.WINDOWS = constants.SERVICES.WINDOWS;
module.exports.AMAZON = constants.SERVICES.AMAZON;

module.exports.config = function (configIn) {
	apple.readConfig(configIn);
	google.readConfig(configIn);
	windows.readConfig(configIn);
	amazon.readConfig(configIn);
	verbose.setup(configIn);
};

module.exports.setup = function(cb) {
	if (!cb && Promise) {
		return new Promise(function(resolve,reject) {
			self.setup(function(error) {
				return error ? reject(error) : resolve();
			});
		});
	}

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

module.exports.validate = function(service,receipt,cb) {
	if (!cb && Promise) {
		return new Promise(function(resolve,reject) {
			self.validate(service,receipt,function(error,response) {
				return error ? reject(error) : resolve(response);
			});
		});
	}

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
			cb(new Error('invalid service given: ' + service));
			break;
	}
};

module.exports.validateOnce = function (service, secretOrPubKey, receipt, cb) {
	if (!cb && Promise) {
		return new Promise(function(resolve,reject) {
			self.validate(service,receipt,function(error,response) {
				return error ? reject(error) : resolve(response);
			});
		});
	}

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
			verbose.log('<.validateOnce>',secretOrPubKey,receipt);
			cb(new Error('invalid service given: ' + service));
			break;
	}
};

module.exports.isValidated = function (response) {
	return response && response.status === constants.VALIDATION.SUCCESS;
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
	if (!cb && Promise) {
		return new Promise(function(resolve,reject) {
			google.refreshToken(function(error,response) {
				return error ? reject(error) : resolve(response);
			});
		});
	}

	google.refreshToken(cb);
};

// test use only
module.exports.reset = function () {
	// resets google setup
	google.reset();
};
