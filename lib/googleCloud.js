'use strict';

/**
 * Uses Google API and the receipt only requies purchaseToken string to validate
 *
 */

const { GoogleAuth } = require('google-auth-library');
const util = require('util');
const constants = require('../constants');
const verbose = require('./verbose');

const NAME = 'GOOGLE API';
const PRODUCT_VAL = 'https://www.googleapis.com/androidpublisher/v3/applications/%s/purchases/products/%s/tokens/%s';
const SUBSCR_VAL = 'https://www.googleapis.com/androidpublisher/v3/applications/%s/purchases/subscriptions/%s/tokens/%s';

const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/androidpublisher']
});

module.exports = {
    validatePurchase: validatePurchase
};

function validatePurchase(receipt, cb) {
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
    
  
    _getToken(function (error, token) {
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

function _getToken(cb) {
    auth.getClient()
        .then(client => client.getAccessToken())
        .then(token => cb(null, token.token))
        .catch(error => cb(error));
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

