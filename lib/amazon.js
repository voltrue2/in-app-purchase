var constants = require('../constants');
var request = require('request');
var async = require('async');
var fs = require('fs');

var VER = '2.0';
var SECRET = '{developerSecret}';
var UID = '{userId}';
var PTOKEN = '{purchaseToken}';
var ERRORS = {
	VALIDATION: {
		400: 'The transaction represented by this Purchase Token is no longer valid.',
		404: 'Unknown operation exception.',
		496: 'Invalid sharedSecret',
		497: 'Invalid User ID',
		498: 'Invalid Purchase Token',
		499: 'The Purchase Token was created with credentials that have expired, use renew to generate a valid purchase token.',
		500: 'There was an Internal Server Error'
	},
	RENEW: {
		400: 'Bad Request',
		404: 'Unknown operation exception.',
		496: 'Invalid sharedSecret',
		497: 'Invalid User ID',
		498: 'Invalid Purchase Token',
		500: 'There is an Internal Server Error'
	}
};

var VALIDATION_PATH = 'https://appstore-sdk.amazon.com/version/' +
	VER + '/verify/developer/' + SECRET + '/user/' + UID + '/purchaseToken/' + PTOKEN;
// currently not used
var RENEW_PATH = 'https://appstore-sdk.amazon.com/version/' +
	VER + '/renew/developer/' + SECRET + '/user/' + UID + '/purchaseToken/' + PTOKEN;

var config;

module.exports.readConfig = function (configIn) {
	config = configIn;
};

module.exports.setup = function (cb) {
	if (!config || !config.secret) {
		return cb();
	}
	fs.exists(config.secret, function (exists) {
		var secret = '';
		if (!exists) {
			// use the string value literally
			secret = config.secret;
			VALIDATION_PATH = VALIDATION_PATH.replace(SECRET, config.secret);
			RENEW_PATH = RENEW_PATH.replace(SECRET, config.secret);
			return cb();
		}
		// assume it as a file path
		fs.readFile(config.secret, 'UTF-8', function (error, val) {
			if (error) {
				return cb(error);
			}
			secret = val.replace(/(\r|\n)/g, '');
			VALIDATION_PATH = VALIDATION_PATH.replace(SECRET, secret);
			RENEW_PATH = RENEW_PATH.replace(SECRET, secret);
			cb();
		});
	});
};

/*
receipt: {
	userId: <user ID amazon in-app-purchase-server responds with>
	receiptId: <receipt ID from amazon>
}
*/
module.exports.validatePurchase = function (receipt, cb) {
	var path = VALIDATION_PATH.replace(UID, receipt.userId);
	path = path.replace(PTOKEN, receipt.receiptId);
	send(path, ERRORS.VALIDATION, function (error, res) {
		if (error) {
			if (res == 499) {
				// must be renewed and re-tried
				var renew = RENEW_PATH.replace(UID, receipt.userId);
				renew = renew.replace(PTOKEN, receipt.receiptId);
				send(renew, ERRORS.RENEW, function (error, renewed) {
					if (error) {
						var renewedErrorRes = {
							status: renewed,
							message: ERRORS.RENEW[renewed] || 'Unkown'
						};
						return cb(error, renewedErrorRes);
					}
					var renewedReceipt = {
						receiptId: renewed.purchaseToken,
						userId: receipt.userId
					};
					module.exports.validatePurchase(renewedReceipt, cb);
				});
				return;
			}		

			var errorRes = {
				status: res,
				message: ERRORS.VALIDATION[res] || 'Unknown'
			};

			return cb(error, errorRes);
		}
		cb(null, res);
	});
};

module.exports.getPurchaseData = function (purchase) {
	if (!purchase || !purchase.purchaseToken) {
		return null;
	}
	var obj = {};
	obj.transactionId = purchase.purchaseToken;
	obj.productId = purchase.sku;
	obj.purchaseData = purchase.itemType;
	obj.quantity = 1;
	obj.purchaseDate = purchase.startDate || Date.now();
	obj.expirationDate = purchase.endDate || 0;
	return [obj];
};

function send(path, errorMap, cb) {
	request.get(path, function (error, response, body) {
		var errorMsg = errorMap[response.statusCode];
		if (errorMsg) {
			return cb(new Error(errorMsg + ': ' + path), response.statusCode);
		}
		if (error) {
			error.message += ': ' + path;
			return cb(error);
		}
		var res = JSON.parse(body);
		res.status = 0;
		res.service = constants.SERVICES.AMAZON;
		cb(null, res);
	});
}
