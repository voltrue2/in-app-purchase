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
	21008: 'This receipt is a production receipt, but it was sent to the sandbox service for verification.',
	2: 'The receipt is valid, but purchased nothing.'
};
var REC_KEYS = {
	IN_APP: 'in_app',
	BUNDLE_ID: 'bundle_id',
	TRANSACTION_ID: 'transaction_id',
	PRODUCT_ID: 'product_id',
	ORIGINAL_PURCHASE_DATE_MS: 'original_purchase_date_ms',
	EXPIRES_DATE_MS: 'expires_date_ms',
	EXPIRES_DATE: 'expires_date'
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
	if ('requestDefaults' in configIn) {
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
	var status;
	var content = { 'receipt-data': receipt };
	if (config && config.applePassword) {
		content.password = config.applePassword;
	}
	// we try production first
	send('https://' + liveHost + path, content, function (error, res, data) {
		if (error) {
			// 1 is unknown
			status = data ? data.status : 1;
			return cb(error, { status: status, message: errorMap[status] || 'Unknown' });
		}
		if (data.status === 21007) {
			// the receipt is for sandbox
			send('https://' + sandboxHost + path, content, function (error, res, data) {
				if (error) {
					// 1 is unknown
					status = data ? data.status : 1;
					return cb(error, { status: status, message: errorMap[status] || 'Unknown' });
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
	if (purchase.receipt[REC_KEYS.IN_APP]) {
		// iOS 6+
		var inapp = purchase.receipt[REC_KEYS.IN_APP];
		for (var i = 0, len = inapp.length; i < len; i++) {
			var item = inapp[i];
			var exp = getSubscriptionExpireDate(item);

			if (options && options.ignoreExpired && exp && Date.now() - exp >= 0) {
				// we are told to ignore expired item and it is expired
				continue;
			}

			data.push({
				bundleId: purchase.receipt[REC_KEYS.BUNDLE_ID],
				transactionId: item[REC_KEYS.TRANSACTION_ID],
				productId: item[REC_KEYS.PRODUCT_ID],
				purchaseDate: item[REC_KEYS.ORIGINAL_PRUCHASE_DATE_MS],
				quantity: parseInt(item.quantity, 10),
				expirationDate: exp
			});
		}
		return data;
	}
	// old and will be deprecated by Apple
	data.push({
		bundleId: purchase.receipt[REC_KEYS.BUNDLE_ID],
		transactionId:  purchase.receipt[REC_KEYS.TRANSACTION_ID],
		productId: purchase.receipt[REC_KEYS.PRODUCT_ID],
		purchaseDate: purchase.receipt[REC_KEYS.ORIGINAL_PURCHASE_DATE_MS],
		quantity: parseInt(purchase.receipt.quantity, 10),
		expirationDate: getSubscriptionExpireDate(purchase)
	});
	return data;
};

function getSubscriptionExpireDate(data) {
	if (data[REC_KEYS.EXPIRES_DATE_MS]) {
		return parseInt(data[REC_KEYS.EXPIRES_DATE_MS], 10);
	}
	if (data[REC_KEYS.EXPIRES_DATE]) {
		return parseInt(data[REC_KEYS.EXPIRES_DATE], 10);
	}
	return 0;
}

function handleResponse(receipt, data, cb) {
	data.service = constants.SERVICES.APPLE;
	if (data.status === constants.VALIDATION.SUCCESS) {
		if (data.receipt[REC_KEYS.IN_APP] && !data.receipt[REC_KEYS.IN_APP].length) {
			// receipt is valid, but the receipt bought nothing
			// probably hacked: https://forums.developer.apple.com/thread/8954
			// https://developer.apple.com/library/mac/technotes/tn2413/_index.html#//apple_ref/doc/uid/DTS40016228-CH1-RECEIPT-HOW_DO_I_USE_THE_CANCELLATION_DATE_FIELD_
			data.status = constants.VALIDATION.POSSIBLE_HACK;
			data.message = errorMap[data.status];
			return cb(new Error('failed to validate for empty purchased list'), data);
		}
		// validated successfully
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
