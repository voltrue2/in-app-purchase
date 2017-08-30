var verbose = require('./verbose');
var constants = require('../constants');
var xmlCrypto = require('xml-crypto');
var Parser = require('xmldom').DOMParser;
var request = require('request');
var responseData = require('./responseData');
var url = 'https://lic.apps.microsoft.com/licensing/certificateserver/?cid=';
var sigXPath = '//*//*[local-name(.)=\'Signature\' and namespace-uri(.)=\'http://www.w3.org/2000/09/xmldsig#\']';

var NAME = '<Windows>';

module.exports.readConfig = function (configIn) {
	if (!configIn) {
		// no required config
		return;
	}
	verbose.setup(configIn);
	// Apply any default settings to Request.
	if ('requestDefaults' in configIn) {
		request = request.defaults(configIn.requestDefaults);
	}
};

// receipt is an XML string... oh microsoft... why?
module.exports.validatePurchase = function (receipt, cb) {
	var certId;
	var options = {
		ignoreWhiteSpace: true,
		errorHandler: {
			fatalError: handleError,
			error: handleError
		}
	};
	var handleError = function (error) {
		if (typeof error === 'string') {
			error = new Error(error);
		}
		cb(error);
	};
	verbose.log(NAME, 'Validate:', receipt);
	try {
		var doc = new Parser(options).parseFromString(receipt);
		certId = doc.firstChild.getAttribute('CertificateId');
	} catch (e) {
		verbose.log(NAME, 'Failed:', e);
		return cb(new Error('failed to validate purchase: ' + e.message), { status: constants.VALIDATION.FAILURE, message: e.message });
	}
	if (!certId) {
		verbose.log(NAME, 'Failed: Invalid certificate ID');
		return cb(new Error('failed to find certificate ID'), { status: constants.VALIDATION.FAILURE, message: 'Invalid certificate ID' });
	}
	verbose.log(NAME, 'Get public key from:', url + certId);
	send(url + certId, function (error, body) {
		if (error) {
			verbose.log(NAME, 'Failed to get public key:', (url + certId), error);
			return cb(error);
		}
		var data;
		try {
			var publicKey = body;
			var canonicalXML = removeWhiteSpace(doc.firstChild).toString();
			var signature = xmlCrypto.xpath(doc, sigXPath);
			var sig = new xmlCrypto.SignedXml();
			sig.keyInfoProvider = new Cert(publicKey);
			sig.loadSignature(signature.toString());
			if (sig.checkSignature(canonicalXML)) {
				// create purchase data
				var items = doc.getElementsByTagName('ProductReceipt');
				var purchases = [];
				for (var i = 0, len = items.length; i < len; i++) {
					var item = items[i];
					purchases.push({
						transactionId: item.getAttribute('Id'),
						productId: item.getAttribute('ProductId'),
						purchaseDate: item.getAttribute('PurchaseDate'),
						expirationDate: item.getAttribute('ExpirationDate'),
						productType: item.getAttribute('ProductType'),
						appId: item.getAttribute('AppId')
					});
				}
				// successful validation
				data = {
					service: constants.SERVICES.WINDOWS,
					status: constants.VALIDATION.SUCCESS,
					purchases: purchases
				};
			}
		} catch (e) {
			verbose.log(NAME, 'Failed to validated:', e);
			return cb(new Error('failed to validate purchase: ' + e.message), { status: constants.VALIDATION.FAILURE, message: e.message });
		}
		// done
		verbose.log(NAME, 'Validation success:', data);
		cb(null, data);
	});
};

module.exports.getPurchaseData = function (purchase, options) {
	if (!purchase || !purchase.purchases || !purchase.purchases.length) {
		return null;
	}
	var data = [];
	for (var i = 0, len = purchase.purchases.length; i < len; i++) {
		var item = purchase.purchases[i];
		var exp = new Date(item.expirationDate).getTime();

		if (options && options.ignoreExpired && exp && Date.now() - exp >= 0) {
			// we are told to ignore expired item and it has been expired
			continue;
		}

		var parsed = responseData.parse(item);
		parsed.purchaseData =  new Date(item.purchaseDate).getTime();
		parsed.expirationDate = exp;
		parsed.quantity = 1;
		data.push(parsed);
	}
	return data;
};

function send(url, cb) {
	var options = {
		encoding: null,
		url: url
	};
	request.get(options, function (error, res, body) {
		if (error) {
			return cb(error, { status: res.status, message: body });
		}
		if (!body) {
			return cb(new Error('invalid response from the service'), { status: res.status, message: 'Unknown' });
		}
		cb(null, body.toString('utf8'));
	});
}

function removeWhiteSpace(node) {
	var rootNode = node;
	while (node) {
		if (!node.tagName && (node.nextSibling || node.previousSibling)) {
			node.parentNode.removeChild(node);
		}
		removeWhiteSpace(node.firstChild);
		node = node.nextSibling;
	}
	return rootNode;
}

function Cert(pubKey) {
	this._pubKey = pubKey;
}

Cert.prototype.getKeyInfo = function () {
	return '<X509Data></X509Data>';
};

Cert.prototype.getKey = function () {
	return this._pubKey;
};
