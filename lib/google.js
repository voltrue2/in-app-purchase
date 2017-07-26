var constants = require('../constants');
var fs = require('fs');
var crypto = require('crypto');
var async = require('./async');
var request = require('request');
var responseData = require('./responseData');
var verbose = require('./verbose');

var testMode = false;
var sandboxPkey = 'iap-sandbox';
var livePkey = 'iap-live';
var config = null;
var keyPathMap = {};
var publicKeyMap = {};
var googleTokenMap = {};
var checkSubscriptionState = false;
var KEYS = {
	ACCESS_TOKEN: 'access_token',
	GRANT_TYPE: 'grant_type',
	CLIENT_ID: 'client_id',
	CLIENT_SECRET: 'client_secret',
	REFRESH_TOKEN: 'refresh_token'
};
var ENV_PUBLICKEY = {
	SANDBOX: 'GOOGLE_IAB_PUBLICKEY_SANDBOX',
	LIVE: 'GOOGLE_IAB_PUBLICKEY_LIVE'
};
var NAME = '<Google>';

function isValidConfigKey(key) {
	return key.match(/^google/);
}

// test use only
module.exports.reset = function () {
	config = null;
	keyPathMap = {};
	publicKeyMap = {};
	googleTokenMap = {};
	checkSubscriptionState = false;
};

module.exports.readConfig = function (configIn) {
	if (!configIn) {
		// no google iap or public key(s) from ENV variables
		return;
	}
	verbose.setup(configIn);
	// we do NOT use live if true
	testMode = configIn.test || false;
	verbose.log(NAME, 'test mode?', testMode);
	config = {};
	var configValueSet = false;
	Object.keys(configIn).forEach(function (key) {
		if (isValidConfigKey(key)) {
			config[key] = configIn[key];
			configValueSet = true;
		}
	});

	// backward compatibility
	if (configIn && configIn.publicKeyStrSandbox) {
		config.googlePublicKeyStrSandbox = configIn.publicKeyStrSandbox;
	}
	if (configIn && configIn.publicKeyStrLive) {
		config.googlePublicKeyStrLive = configIn.publicKeyStrLive;
	}

	if (!configValueSet) {
		config = null;
		return;
	}

	keyPathMap.sandbox = config.googlePublicKeyPath + sandboxPkey;
	keyPathMap.live = config.googlePublicKeyPath + livePkey;

	if (config.googleAccToken && config.googleRefToken && config.googleClientID && config.googleClientSecret) {
		googleTokenMap.accessToken = config.googleAccToken;
		googleTokenMap.refreshToken = config.googleRefToken;
		googleTokenMap.clientID = config.googleClientID;
		googleTokenMap.clientSecret = config.googleClientSecret;
		checkSubscriptionState = true;
	}
};

module.exports.setup = function (cb) {
	if (config && (config.googlePublicKeyStrSandbox || config.googlePublicKeyStrLive)) {
		// try to read public key value as string
		if (config && config.googlePublicKeyStrSandbox) {
			publicKeyMap.sandbox = config.googlePublicKeyStrSandbox;
		}
		if (config && config.googlePublicKeyStrLive) {
			publicKeyMap.live = config.googlePublicKeyStrLive;
		}
		return cb();
	}
	if (!config || !config.googlePublicKeyPath) {
		// try to read public key value from ENV if available
		// if this is set, reading the public key value from file system is ignored
		if (process.env[ENV_PUBLICKEY.SANDBOX]) {
			publicKeyMap.sandbox = process.env[ENV_PUBLICKEY.SANDBOX].replace(/s+$/, '');
		}
		if (process.env[ENV_PUBLICKEY.LIVE]) {
			publicKeyMap.live = process.env[ENV_PUBLICKEY.LIVE].replace(/s+$/, '');
		}
		return cb();
	}
	var keys = Object.keys(keyPathMap);
	async.eachSeries(keys, function (key, next) {
		var pkeyPath = keyPathMap[key];
		fs.readFile(pkeyPath, function (error, fileData) {
			// we are ignoring missing public key file(s)
			if (error) {
				return next();
			}
			publicKeyMap[key] = fileData.toString().replace(/\s+$/, '');
			next();
		});
	}, cb);
};

// receipt is an object
/*
* receipt = { receipt: 'stringified receipt data', signature: 'receipt signature' };
* if receipt.data is an object, it silently stringifies it
*/
module.exports.validatePurchase = function (dPubkey, receipt, cb) {

	verbose.log(NAME, 'Validate this:', receipt);

	if (typeof receipt !== 'object') {
		verbose.log(NAME, 'Failed: malformed receipt');
		return cb(new Error('malformed receipt: ' + receipt), {
			status: constants.VALIDATION.FAILURE,
			message: 'Malformed receipt'
		});
	}
	// the data might be in receipt and not in data
	if (receipt.receipt && !receipt.data) {
		receipt.data = receipt.receipt;
	}
	if (!receipt.data || !receipt.signature) {
		verbose.log(NAME, 'Failed: missing receipt content');
		return cb(new Error('missing receipt data:\n' + JSON.stringify(receipt)), {
			status: constants.VALIDATION.FAILURE,
			message: 'Malformed receipt'
		});
	}
	if (typeof receipt.data === 'object') {
		// stringify and make sure to escpace the value of developerPayload
		receipt.data = JSON.stringify(receipt.data).replace(/\//g, '\\/');
		verbose.log(NAME, 'Auto stringified receipt data:', receipt.data);
	}

	var pubkey = publicKeyMap.live;

	// override pubkey to allow dynamically fed public key to validate
	if (dPubkey) {
		verbose.log(NAME, 'Using dynamically fed public key:', dPubkey);
		pubkey = dPubkey;
	}

	verbose.log(NAME, 'Try validate against live public key:', pubkey);
	if (testMode) {
		// try sandbox only
		validatePublicKey(receipt, getPublicKey(pubkey), function (error, data) {
			if (error) {
				verbose.log(NAME, 'Failed against sandbox public key:', error);
				// we will send the error from live only
				return cb(error, {
					status: constants.VALIDATION.FAILURE,
					message: error.message
				});
			}
			verbose.log(NAME, 'Validation against sandbox public key successful:', data);
			// sandbox worked
			checkSubscriptionStatus(data, cb);
		});
		return;	
	}
	// try live first
	validatePublicKey(receipt, getPublicKey(pubkey), function (error, data) {
		if (error) {
			if (!publicKeyMap.sandbox) {
				verbose.log(NAME, 'Failed to validate against:', pubkey, error);
				return cb(error, {
					status: constants.VALIDATION.FAILURE,
					message: error.message
				});
			}
			pubkey = publicKeyMap.sandbox;
			verbose.log(NAME, 'Failed against live public key:', error);
			verbose.log(NAME, 'Try validate against sandbox public key:', pubkey);
			// now try sandbox
			validatePublicKey(receipt, getPublicKey(pubkey), function (error2, data) {
				if (error2) {
					verbose.log(NAME, 'Failed against sandbox public key:', error2);
					// we will send the error from live only
					return cb(error, {
						status: constants.VALIDATION.FAILURE,
						message: error.message
					});
				}
				verbose.log(NAME, 'Validation against sandbox public key successful:', data);
				// sandbox worked
				checkSubscriptionStatus(data, cb);
			});
			return;
		}

		verbose.log(NAME, 'Validation against live public key successful:', data);
		// live worked
		checkSubscriptionStatus(data, cb);

	});
};

module.exports.getPurchaseData = function (purchase) {
	if (!purchase) {
		return null;
	}
	var data = [];
	/*
	var purchaseInfo = {
		transactionId: purchase.purchaseToken,
		orderId: purchase.orderId,
		productId: purchase.productId,
		purchaseDate: purchase.purchaseTime,
		quantity: 1
	};
	*/
	var purchaseInfo = responseData.parse(purchase);
	purchaseInfo.transactionId = purchase.purchaseToken;
	purchaseInfo.purchaseDate = purchase.purchaseTime;
	purchaseInfo.purchaseState = purchase.purchaseState;
	purchaseInfo.quantity = 1;

	if (checkSubscriptionState) {
		purchaseInfo.expirationDate = purchase.expirationTime;
	}

	data.push(purchaseInfo);
	return data;
};

/**
* Function to check subscription status in Google Play
* @param	{Object}	data	receipt data
* @param	{Function}	cb	callback function
*/
function checkSubscriptionStatus(data, cb) {

	data.service = constants.SERVICES.GOOGLE;

	if (!checkSubscriptionState) {
		return cb(null, data);
	}
	var packageName = data.packageName;
	var subscriptionID = data.productId;
	var purchaseToken = data.purchaseToken;
	var urlPurchaseTypeSegment = data.autoRenewing === undefined ? 'products' : 'subscriptions';

	var url = 'https://www.googleapis.com/androidpublisher/v2/applications/' + packageName +
		'/purchases/' + urlPurchaseTypeSegment + '/' + subscriptionID + '/tokens/' + purchaseToken;

	var state;

	var getSubInfo = function (next) {

		verbose.log(NAME, 'Get subscription info from', url);

		getSubscriptionInfo(url, function (error, response, body) {

			if (error || 'error' in body) {

				verbose.log(NAME, 'Failed to get subscription info from', url, error, body);

				state = constants.VALIDATION.FAILURE;
				// we must move on to validate()
				next();
				return;
			}

			_copyPurchaseDetails(data, body);
			state = constants.VALIDATION.SUCCESS;

			verbose.log(NAME, 'Successfully retrieved subscription info from', url, data);

			next();
		});
	};

	var validate = function (next) {
		switch (state) {
			case constants.VALIDATION.SUCCESS:
				// This line tells the next function there is no need to get subscription Info again.
				// We should read this as a "No, don't call that function again"

				verbose.log(NAME, 'Validated successfully');

				next(null, constants.VALIDATION.FAILURE);
				break;
			case constants.VALIDATION.FAILURE:

				verbose.log(NAME, 'Refresh Google token');

				refreshGoogleTokens(function (error, res, body) {
					if (error) {

						verbose.log(NAME, 'Failed to refresh Google token:', error);

						return cb(error, {
							status: constants.VALIDATION.FAILURE,
							message: error.message
						});
					}

					var parsedBody = JSON.parse(body);

					if ('error' in parsedBody) {

						verbose.log(NAME, 'Failed to refresh Google token:', parsedBody);

						return cb(new Error(parsedBody.error), {
							status: constants.VALIDATION.FAILURE,
							message: parsedBody.error
						});
					}

					// Store new access token
					googleTokenMap.accessToken = parsedBody[KEYS.ACCESS_TOKEN];

					state = constants.VALIDATION.SUCCESS;

					verbose.log(NAME, 'Successfully refreshed Google token:', googleTokenMap.accessToken);

					// On the other hand, here we are telling the next function
					// to get subscription Info again.
					next();
				});
				break;
		}
	};

	var  recheck = function (next) {
		if (state === constants.VALIDATION.SUCCESS) {

			verbose.log(NAME, 'Re-check subscription info:', url);

			getSubscriptionInfo(url, function (error, response, body) {
				if (error || 'error' in body) {

					verbose.log(NAME, 'Re-check failed:', url, error, body);

					state = constants.VALIDATION.FAILURE;
					next(error ? error : new Error(body.error));
					return;
				}

				_copyPurchaseDetails(data, body);
				state = constants.VALIDATION.SUCCESS;

				verbose.log(NAME, 'Re-check successfully retrieved subscription info:', url, data);

				next();
			});
			return;
		}
		// refresh failed
		state = constants.VALIDATION.FAILURE;
		next();
	};

	var done = function (error) {
		if (error) {
			return cb(error, {
				status: constants.VALIDATION.FAILURE,
				message: error.message
			});
		}

		cb(null, data);
	};

	var tasks = [
		getSubInfo,
		validate,
		recheck
	];

	async.series(tasks, done);
}

function _copyPurchaseDetails(data, body) {
	data.autoRenewing = body.autoRenewing;
	data.expirationTime = body.expiryTimeMillis;
	data.paymentState = body.paymentState;
	data.priceCurrencyCode = body.priceCurrencyCode;
	data.priceAmountMicros = body.priceAmountMicros;
	data.cancelReason = body.cancelReason;
	data.countryCode = body.countryCode;
}

function getPublicKey(publicKey) {
	if (!publicKey) {
		return null;
	}
	var key = chunkSplit(publicKey, 64, '\n');
	var pkey = '-----BEGIN PUBLIC KEY-----\n' + key + '-----END PUBLIC KEY-----\n';
	return pkey;
}

function validatePublicKey(receipt, pkey, cb) {
	if (!receipt || !receipt.data) {
		return cb(new Error('missing receipt data'));
	}
	if (!pkey) {
		return cb(new Error('missing public key'));
	}
	if (typeof receipt.data !== 'string') {
		return cb(new Error('receipt.data must be a string'));
	}
	var validater = crypto.createVerify('SHA1');
	var valid;
	validater.update(receipt.data);
	try {
		valid = validater.verify(pkey, receipt.signature, 'base64');
	} catch (error) {
		return cb(error);
	}
	if (valid) {
		// validated successfully
		var data = JSON.parse(receipt.data);
		data.status = constants.VALIDATION.SUCCESS;
		return cb(null, data);
	}
	// failed to validate
	cb(new Error('failed to validate purchase'));
}

function chunkSplit(str, len, end) {
	len = parseInt(len, 10) || 76;
	if (len < 1) {
		return false;
	}
	end = end || '\r\n';
	return str.match(new RegExp('.{0,' + len + '}', 'g')).join(end);
}

function getSubscriptionInfo(url, cb) {
	var options = {
		method: 'GET',
		url: url,
		headers: {
			'Authorization': 'Bearer ' + googleTokenMap.accessToken
		},
		json: true
	};

	request(options, cb);
}

module.exports.refreshToken = function (cb) {

	if (!checkSubscriptionState) {
		return cb(new Error('missing google play api info'), {
			status: constants.VALIDATION.FAILURE,
			message: 'client_id, client_secret, access_token and refres_token should be provided'
		});
	}

	refreshGoogleTokens(function (error, res, body) {
		if (error) {
			return cb(error, { status: constants.VALIDATION.FAILURE, message: error.message });
		}

		var parsedBody = JSON.parse(body);

		if ('error' in parsedBody) {
			return cb(new Error(parsedBody.error), {
				status: constants.VALIDATION.FAILURE,
				message: parsedBody.error
			});
		}

		// Store new access token
		googleTokenMap.accessToken = parsedBody[KEYS.ACCESS_TOKEN];
		cb(null, parsedBody);
	});
};

function refreshGoogleTokens(cb) {

	var body = {};
	body[KEYS.GRANT_TYPE] = KEYS.REFRESH_TOKEN;
	body[KEYS.CLIENT_ID] = googleTokenMap.clientID;
	body[KEYS.CLIENT_SECRET] = googleTokenMap.clientSecret;
	body[KEYS.REFRESH_TOKEN] = googleTokenMap.refreshToken;

	var options = {
		method: 'POST',
		url: 'https://accounts.google.com/o/oauth2/token',
		form: body
	};

	request(options, cb);
}
