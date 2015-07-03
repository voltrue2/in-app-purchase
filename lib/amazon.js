var constants = require('../constants');
var request = require('request');
var async = require('async');

var VER = '1.0';
var SECRET = '{developerSecret}';
var UID = '{userId}';
var PTOKEN = '{purchaseToken}';
var ERRORS = {
	validation: {
		400: 'The transaction represented by this Purchase Token is no longer valid.',
		496: 'Invalid sharedSecret',
		497: 'Invalid User ID',
		498: 'Invalid Purchase Token',
		499: 'The Purchase Token was created with credentials that have expired, use renew to generate a valid purchase token.',
		500: 'There was an Internal Server Error'
	},
	renew: {
		400: 'Bad Request',
		496: 'Invalid sharedSecret',
		497: 'Invalid User ID',
		498: 'Invalid Purchase Token',
		500: 'There is an Internal Server Error'
	}
};

var VALIDATION_PATH = 'https://appstore-sdk.amazon.com/version/' + VER + '/verifyReceiptId/developer/' + SECRET + '/user/' + UID + '/receiptId/' + PTOKEN;
var RENEW_PATH = 'https://appstore-sdk.amazon.com/version/' + VER + '/renew/developer/' + SECRET + '/user/' + UID + '/purchaseToken/' + PTOKEN;


module.exports.validatePurchase = function (receipt, cb) {
	VALIDATION_PATH = VALIDATION_PATH.replace('{purchaseToken}', receipt); // IF IT DIDN'T PASS AS CONFIG VALUE, REPLACE IT HERE
	send(cb);
};

module.exports.readConfig = function (configIn) {
	for (var key in configIn) {
		VALIDATION_PATH = VALIDATION_PATH.replace('{' + key + '}', configIn[key]);
	}
}

module.exports.getPurchaseData = function (purchase) {
	if (!purchase || !purchase.receiptId) {
		return null;
	}
	var data = [];
	var retObj = {};
	retObj.transactionId = purchase.receiptId;
	retObj.productId = purchase.productId;
	retObj.purchaseDate = purchase.purchaseDate;
	retObj.quantity 	= purchase.quantity;
	data.push(retObj);

	return data;
};

function send(cb) {
	request.get(VALIDATION_PATH, function (err, response, body) {
		VALIDATION_PATH = 'https://appstore-sdk.amazon.com/version/' + VER + '/verifyReceiptId/developer/' + SECRET + '/user/' + UID + '/receiptId/' + PTOKEN;
		if(ERRORS.validation[response.statusCode] != undefined) {
			cb(ERRORS.validation[response.statusCode])
		} else if (err) {
			cb(err);
		} else  {
			//console.log(response, body);
			cb(null, body);
		}
	});
}

