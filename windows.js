var constants = require('./constants');
var xmlCrypto = require('xml-crypto');
var Parser = require('xmldom').DOMParser;
var async = require('async');
var request = require('request');
var url = 'https://lic.apps.microsoft.com/licensing/certificateserver/?cid=';
var sigXPath = '//*//*[local-name(.)=\'Signature\' and namespace-uri(.)=\'http://www.w3.org/2000/09/xmldsig#\']';

// receipt is an XML string... oh microsoft... why?
module.exports.validatePurchase = function (receipt, cb) {
	var json;
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
	try {
		var doc = new Parser(options).parseFromString(receipt);
		certId = doc.firstChild.getAttribute('CertificateId');
	} catch (e) {
		return cb(new Error('failed to validate purchase: ' + e.message), { status: constants.VALIDATION.FAILURE });
	}
	if (!certId) {
		return cb(new Error('failed to find certificate ID'));
	}
	send(url + certId, function (error, body) {
		if (error) {
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
			return cb(new Error('failed to validate purchase: ' + e.message), { status: constants.VALIDATION.FAILURE });
		}
		// done
		cb(null, data);
	});
};

module.exports.getPurchaseData = function (purchase) {
	if (!purchase || !purchase.purchases || !purchase.purchases.length) {
		return null;
	}
	var data = [];
	for (var i = 0, len = purchase.purchases.length; i < len; i++) {
		var item = purchase.purchases[i];
		data.push({
			productId: item.productId,
			purchaseDate: new Date(item.purchaseDate).getTime(),
			expirationDate: new Date(item.expirationDate).getTime(), // window only
			quantity: 1
		});
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
			return cb(error);
		}
		if (!body) {
			return cb(new Error('invalid response from the service'));
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
