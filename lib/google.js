var constants = require('../constants');
var fs = require('fs');
var crypto = require('crypto');
var async = require('async');
var request = require('request');

var sandboxPkey = 'iap-sandbox';
var livePkey = 'iap-live';
var config = null;
var keyPathMap = {};
var publicKeyMap = {};
var googleTokenMap = {};
var checkSubscriptionState = false;

var ENV_PUBLICKEY = {
	SANDBOX: 'GOOGLE_IAB_PUBLICKEY_SANDBOX',
	LIVE: 'GOOGLE_IAB_PUBLICKEY_LIVE'
};

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
* receipt = { data: 'stringified receipt data', signature: 'receipt signature' };
* if receipt.data is an object, it silently stringifies it
*/
module.exports.validatePurchase = function (receipt, cb) {

	if (typeof receipt !== 'object') {
		return cb(new Error('malformed receipt: ' + receipt), {
			status: constants.VALIDATION.FAILURE,
			message: 'Malformed receipt'
		});
	}
	if (!receipt.data || !receipt.signature) {
		return cb(new Error('missing receipt data:\n' + JSON.stringify(receipt)), {
			status: constants.VALIDATION.FAILURE,
			message: 'Malformed receipt'
		});
	}
	if (typeof receipt.data === 'object') {
		// stringify and make sure to escpace the value of developerPayload
		receipt.data = JSON.stringify(receipt.data).replace(/\//g, '\\/');
	}

	// try live first
	validatePublicKey(receipt, getPublicKey(publicKeyMap.live), function (error, data) {
		if (error) {
			// now try sandbox
			validatePublicKey(receipt, getPublicKey(publicKeyMap.sandbox), function (error2, data) {
				if (error2) {
					// we will send the error from live only
					return cb(error, {
						status: constants.VALIDATION.FAILURE,
						message: error.message
					});
				}
				// sandbox worked
				checkSubscriptionStatus(data, cb);
				
			});
			return;
		}
		// live worked
		checkSubscriptionStatus(data, cb);
		
	});
};

module.exports.getPurchaseData = function (purchase) {
	if (!purchase) {
		return null;
	}
	var data = [];
	var purchaseInfo = {
		productId: purchase.productId,
		purchaseDate: purchase.purchaseTime,
		quantity: 1
	};
	
	if(checkSubscriptionState){
		purchaseInfo.transactionId = purchase.purchaseToken;
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
function checkSubscriptionStatus(data, cb){
	
	data.service = constants.SERVICES.GOOGLE;

	if (!checkSubscriptionState) {
		return cb(null, data);
	}
	var packageName = data.packageName;
	var subscriptionID = data.productId;
	var purchaseToken = data.purchaseToken;

	var url = 'https://www.googleapis.com/androidpublisher/v2/applications/' + packageName + 
			'/purchases/subscriptions/' + subscriptionID + '/tokens/' + purchaseToken;

	var getSubInfo = function (next) {
		getSubscriptionInfo(url, function(error, response, body){

			if (error || 'error' in body) {
				callback(null, constants.VALIDATION.FAILURE);
			}

			data.autoRenewing = body.autoRenewing;
			data.expirationTime = body.expiryTimeMillis;

			next(null, constants.VALIDATION.SUCCESS);
		});
	};

	var validate = function (state, next) {
		switch (state) {
			case constants.VALIDATION.SUCCESS:
				// This line tells the next function there is no need to get subscription Info again.
				// We should read this as a "No, don't call that function again"
				next(null, constants.VALIDATION.FAILURE);	
				break;
			case constants.VALIDATION.FAILURE:
				refreshGoogleTokens(function (error, res, body) {
					if (error) {
						return callback(error, {
							status: constants.VALIDATION.FAILURE,
							message: error.message
						});
					}

					var parsedBody = JSON.parse(body);

					if ('error' in parsedBody) {
						return callback(new Error(parsedBody.error), {
							status: constants.VALIDATION.FAILURE,
							message: parsedBody.error
						});
					}

					// Store new access token
					googleTokenMap.accessToken = parsedBody.access_token;

					// On the other hand, here we are telling the next function to get subscription Info again.
					next(null, constants.VALIDATION.SUCCESS);
				});
			break;
		}
	};

	var  recheck = function (state, next) {
		if (state === constants.VALIDATION.SUCCESS) {
			getSubscriptionInfo(url, function (error, response, body) {
				if(error || 'error' in body){
					next(null, constants.VALIDATION.FAILURE);
				}
				data.autoRenewing = body.autoRenewing;
				data.expirationTime = body.expiryTimeMillis;
			
				next(null, constants.VALIDATION.SUCCESS);
			});
			return;
		}
		// refresh failed
		next(null, constatns.VALIDATION.FAILURE);
	};

	var done = function (error) {
		if (error) {
			return cb(error, result);
		}
		cb(null, data);
	};

	var tasks = [
		getSubInfo,
		validate,
		recheck
	];

	async.waterfall(tasks, done);
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
	validater.update(receipt.data);
	var valid = validater.verify(pkey, receipt.signature, 'base64');
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
		if(error){
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
		googleTokenMap.accessToken = parsedBody.access_token;
		cb(null, parsedBody);
	});
};

function refreshGoogleTokens(cb) {

	var body = {
		grant_type: 'refresh_token',
		client_id: googleTokenMap.clientID,
		client_secret: googleTokenMap.clientSecret,
		refresh_token: googleTokenMap.refreshToken
	};

	var options = {
		method: 'POST',
		url: 'https://accounts.google.com/o/oauth2/token',
		form: body
	};
	
	request(options, cb);
}
