var fs = require('fs');
var crypto = require('crypto');
var async = require('async');

var sandboxPkey = 'iap-sandbox';
var livePkey = 'iap-live';
var config = null;
var pkeyPath = null;
var publicKey;

module.exports.readConfig = function (configIn) {
	config = configIn;
	if (!config) {
		config = {};
	}
	if (config.sandbox) {
		pkeyPath = configIn.googlePublicKeyPath + sandboxPkey;
	} else {
		pkeyPath = configIn.googlePublicKeyPath + livePkey;
	}
};

module.exports.setup = function (cb) {
	if (!config.googlePublicKeyPath) {
		// no google iap
		return cb();
	}
	fs.readFile(pkeyPath, function (error, fileData) {
		if (error) {
			return cb(new Error('failed to read public key file: ' + pkeyPath));
		}
		pkey = fileData.toString().replace(/\s+$/, '');
		pkey = chunkSplit(pkey, 64, '\n'); 
		publicKey = '-----BEGIN PUBLIC KEY-----\n' + pkey + '-----END PUBLIC KEY-----\n';
		cb();
	});	
};

// receipt is an object
/*
* receipt = { data: 'receipt data', signature: 'receipt signature' };
*/
module.exports.validatePurchase = function (receipt, cb) {
	if (typeof receipt !== 'object') {
		return cb(new Error('malformed receipt: ' + receipt));
	}
	if (!receipt.data || !receipt.signature) {
		return cb(new Error('missing receipt data:\n' + JSON.stringify(receipt)));
	}
	validatePublicKey(receipt, cb);
};

function validatePublicKey(receipt, cb) {
	var validater = crypto.createVerify('SHA1');
	validater.update(receipt.data);
	var valid = validater.verify(publicKey, receipt.signature, 'base64');

	if (valid) {
		// validated successfully
		var data = JSON.parse(receipt.data);
		data.status = 0;
		return cb(null, data);
	}
	// failed to validate
	cb(new Error('failed to validate purchase'), data);
}

function chunkSplit(str, len, end) {
	len = parseInt(len, 10) || 76;
	if (len < 1) {
		return false;
	}
	end = end || '\r\n';
	return str.match(new RegExp('.{0,' + len + '}', 'g')).join(end);
}
