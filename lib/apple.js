var constants = require('../constants');
var request = require('request');
var errorMap = {
	21000: 'The App Store could not read the JSON object you provided.',
	21002: 'The data in the receipt-data property was malformed.',
	21003: 'The receipt could not be authenticated.',
	21004: 'The shared secret you provided does not match the shared secret on file for your account.',
	21005: 'The receipt server is not currently available.',
	21006: 'This receipt is valid but the subscription has expired. When this status code is returned to your server, the receipt data is also decoded and returned as part of the response.',
	21007: 'This receipt is a sandbox receipt, but it was sent to the production service for verification.',
	21008: 'This receipt is a production receipt, but it was sent to the sandbox service for verification.'
};

var config = null;
var sandboxHost = 'sandbox.itunes.apple.com';
var liveHost = 'buy.itunes.apple.com';
var path = '/verifyReceipt';

function isValidConfigKey(key) {
	return key.match(/^apple/);
}

module.exports.readConfig = function (configIn) {
	if (!configIn) {
		// no apple iap or password not required
		return;
	}
	config = {};
	var configValueSet = false;
	// Apply any default settings to Request.
	if('requestDefaults' in configIn) {
		request = request.defaults(configIn.requestDefaults);
	}
	Object.keys(configIn).forEach(function (key) {
		if (isValidConfigKey(key)) {
			config[key] = configIn[key];
			configValueSet = true;
		}
	});

	if (!configValueSet) {
		config = null;
		return;
	}
};

module.exports.setup = function (cb) {
	if (!config || !config.applePassword) {

		if (process.env.APPLE_IAP_PASSWORD) {
			config = config || {};
			config.applePassword = process.env.APPLE_IAP_PASSWORD;
		}

	}

	return cb();
};

module.exports.validatePurchase = function (receipt, cb) {
	var content = { 'receipt-data': receipt };
	if (config && config.applePassword) {
		content.password = config.applePassword;
	}
	// we try production first
	send('https://' + liveHost + path, content, function (error, res, data) {
		if (error) {
			return cb(error, { status: data.status, message: errorMap[data.status] || 'Unknown' });
		}

		if (data.exception) {
			return cb(generateAppStoreException(data));
		}

		if (data.status === 21007) {
			// the receipt is for sandbox
			send('https://' + sandboxHost + path, content, function (error, res, data) {
				if (error) {
					return cb(error, { status: data.status, message: errorMap[data.status] || 'Unknown' });
				}

				if (data.exception) {
					return cb(generateAppStoreException(data));
				}

				// sandbox validated
				handleResponse(receipt, data, cb);
			});
			return;
		}
		// production validated
		handleResponse(receipt, data, cb);
	});
};

module.exports.getPurchaseData = function (purchase, options) {
	if (!purchase || !purchase.receipt) {
		return null;
	}
	var data = [];
	if (purchase.receipt.in_app) {
		// iOS 6+
		for (var i = 0, len = purchase.receipt.in_app.length; i < len; i++) {
			var item = purchase.receipt.in_app[i];
			var exp = getSubscriptionExpireDate(item);

			if (options && options.ignoreExpired && exp && Date.now() - exp >= 0) {
				// we are told to ignore expired item and it is expired
				continue;
			}

			data.push({
				transactionId: item.transaction_id,
				productId: item.product_id,
				purchaseDate: item.original_purchase_date_ms,
				quantity: parseInt(item.quantity, 10),
				expirationDate: exp
			});
		}
		return data;
	}
	// old and will be deprecated by Apple
	data.push({
		transactionId:  purchase.receipt.transaction_id,
		productId: purchase.receipt.product_id,
		purchaseDate: purchase.receipt.original_purchase_date_ms,
		quantity: parseInt(purchase.receipt.quantity, 10),
		expirationDate: getSubscriptionExpireDate(purchase)
	});
	return data;
};

function getSubscriptionExpireDate(data) {
	if (data.expires_date_ms) {
		return parseInt(data.expires_date_ms, 10);
	}
	if (data.expires_date) {
		return parseInt(data.expires_date, 10);
	}
	return 0;
}

function handleResponse(receipt, data, cb) {
	if (data.status === constants.VALIDATION.SUCCESS) {
		// validated successfully
		data.service = constants.SERVICES.APPLE;
		return cb(null, data);
	} else {
		// error -> add error message
		data.message = errorMap[data.status] || 'Unkown';
	}
	// failed to validate
	cb(new Error('failed to validate purchase'), data);
}

function send(url, content, cb) {
	var options = {
		encoding: null,
		url: url,
		body: content,
		json: true
	};
	request.post(options, function (error, res, body) {
		return cb(error, res, body);
	});
}

function generateAppStoreException (data) {
	return new Error('AppStoreException: ' + data.status + ' - ' + data.exception);
}
