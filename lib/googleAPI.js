'use strict';

/**
* Uses Google API and the receipt only requies purchaseToken string to validate
* 
*/

var jwt = require('jwt-simple');
var util = require('util');
var request = require('request');
var constants = require('../constants');
var verbose = require('./verbose');

var NAME = 'GOOGLE API';
var GET_TOKEN = 'https://accounts.google.com/o/oauth2/token';
var SCOPE = 'https://www.googleapis.com/auth/androidpublisher';
var PRODUCT_VAL = 'https://www.googleapis.com/androidpublisher/v3/applications/%s/purchases/products/%s/tokens/%s?access_token=%s';
var SUBSCR_VAL = 'https://www.googleapis.com/androidpublisher/v3/applications/%s/purchases/subscriptions/%s/tokens/%s?access_token=%s';

// This comes from Google Developer account
var conf = {
    clientEmail: null,
    privateKey: null
};

module.exports = {
    config: config,
    validatePurchase: validatePurchase
};

function config(_conf) {
    if (!_conf.clientEmail) {
        throw new Error('Google API requires client email');
    }
    if (!_conf.privateKey) {
        throw new Error('Google API requires private key');
    }
    conf.clientEmail = _conf.clientEmail;
    conf.privateKey = _conf.privateKey;
}

/**
* googleServiceAccount is optional
* googleServiceAccount {
    clientEmail: <string>,
    privateKey: <string>
}
* receipt {
    packageName: <string>,
    productId: <string>
    purchaseToken: <string>,
    subscription: <bool>
}
*/
function validatePurchase(_googleServiceAccount, receipt, cb) {
    verbose.log(NAME, 'Validate this', receipt);
    if (!receipt.packageName) {
        return cb(new Error('Missing Package Name'), {
            status: constants.VALIDATION.FAILURE,
            message: 'Missing Package Name',
            data: receipt
        });
    } else if (!receipt.productId) {
        return cb(new Error('Missing Product ID'), {
            status: constants.VALIDATION.FAILURE,
            message: 'Missing Product ID',
            data: receipt
        });
    } else if (!receipt.purchaseToken) {
        return cb(new Error('Missing Purchase Token'), {
            status: constants.VALIDATION.FAILURE,
            message: 'Missing Purchase Token',
            data: receipt
        });
    }
    var googleServiceAccount = conf;
    if (_googleServiceAccount && _googleServiceAccount.clientEmail && _googleServiceAccount.privateKey) {
        verbose.log(NAME, 'Using one time key data:', _googleServiceAccount);
        googleServiceAccount = _googleServiceAccount;
    }
    _getToken(googleServiceAccount.clientEmail, googleServiceAccount.privateKey, function (error, token) {
        if (error) {
            return cb(error, {
                status: constants.VALIDATION.FAILURE,
                message: error.message
            });
        }
        var url = _getValidationUrl(receipt, token);
        verbose.log(NAME, 'Validation URL:', url);
        var params = {
            method: 'GET',
            url: url,
            json: true
        };
        request(params, function (error, res, body) {
            if (error) {
                return cb(error, { status: constants.VALIDATION.FAILURE, message: body });
            }
            if (res.statusCode === 410) {
                // https://stackoverflow.com/questions/45688494/google-android-publisher-api-responds-with-410-purchasetokennolongervalid-erro
                verbose.log(NAME, 'Receipt is no longer valid');
                return cb(new Error('ReceiptNoLongerValid'), {
                    status: constants.VALIDATION.FAILURE,
                    message: body
                });
            }
            if (res.statusCode > 399) {
                verbose.log(NAME, 'Validation failed:', res.statusCode, body);
                var msg;
                try {
                    msg = JSON.stringify(body, null, 2);
                } catch (e) {
                    msg = body;
                }
                return cb(new Error('Status:' + res.statusCode + ' - ' + msg), {
                    status: constants.VALIDATION.FAILURE,
                    message: body,
                    data: receipt
                });
            }
            // we need service
            var resp = {
                service: constants.SERVICES.GOOGLE,
                status: constants.VALIDATION.SUCCESS,
                packageName: receipt.packageName,
                productId: receipt.productId,
                purchaseToken: receipt.purchaseToken
            };
            for (var name in body) {
                resp[name] = body[name];
            }
            cb(null, resp);
        });
    });
}

function _getToken(clientEmail, privateKey, cb) {
    var now = Math.floor(Date.now() / 1000);
    var token = jwt.encode({
        iss: clientEmail,
        scope: SCOPE,
        aud: GET_TOKEN,
        exp: now + 3600,
        iat: now
    }, privateKey, 'RS256');
    var params = {
        method: 'POST',
        url: GET_TOKEN,
        body: 'grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=' + token,
        headers: {
            'content-type': 'application/x-www-form-urlencoded'
        },
        json: true
    };
    verbose.log(NAME, 'Get token with', clientEmail, '\n', privateKey);
    request(params, function (error, res, body) {
        if (error) {
            return cb(error);
        }
        if (res.statusCode > 399) {
            return cb(new Error('Failed to get token: ' + body));
        }
        cb(null, body.access_token);
    });
}

// receipt: { purchaseToken, subscription }
function _getValidationUrl(receipt, token) {
    var url = '';
    switch (receipt.subscription) {
        case true:
            url = SUBSCR_VAL;
        break;
        case false:
        default:
            url = PRODUCT_VAL;
        break;
    }
    return util.format(
        url,
        encodeURIComponent(receipt.packageName),
        encodeURIComponent(receipt.productId),
        encodeURIComponent(receipt.purchaseToken),
        encodeURIComponent(token)
    );
}

