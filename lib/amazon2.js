var constants = require('../constants');
var request = require('request');
var fs = require('fs');
var verbose = require('./verbose');

// for some reason amazon v2.0 RVS is 1.0....
var VER = '1.0';
var SECRET = '{sharedSecret}';
var UID = '{userId}';
var RID = '{receiptId}';
var ERRORS = {
    VALIDATION: {
        400: 'The transaction represented by this Purchase Token is no longer valid.',
        404: 'Unknown operation exception.',
        496: 'Invalid sharedSecret',
        497: 'Invalid User ID',
        498: 'Invalid Purchase Token',
        499: 'The Purchase Token was created with credentials that have expired, use renew to generate a valid purchase token.',
        500: 'There was an Internal Server Error'
    },
    RENEW: {
        400: 'Bad Request',
        404: 'Unknown operation exception.',
        496: 'Invalid sharedSecret',
        497: 'Invalid User ID',
        498: 'Invalid Purchase Token',
        500: 'There is an Internal Server Error'
    }
};

var VALIDATION_HOST = 'https://appstore-sdk.amazon.com';
var VALIDATION_PATH = '/version/' +
    VER + '/verifyReceiptId/developer/' + SECRET + '/user/' + UID + '/receiptId/' + RID;
var RENEW_PATH = '/version/' +
    VER + '/renew/developer/' + SECRET + '/user/' + UID + '/receiptId/' + RID;

var S_VAL_PATH = VALIDATION_PATH;
var S_R_PATH = RENEW_PATH;

var NAME = '<Amazon>';

var config;
var validationHost = VALIDATION_HOST;

module.exports.readConfig = function (configIn) {
    config = configIn;
    // apply configurations
    if (configIn.requestDefaults) {
        request = request.defaults(configIn.requestDefaults);
    }
    // we allow the user to set an alternative validation host for testing
    if (configIn.amazonValidationHost) {
        // changes the host permanently...
        VALIDATION_HOST = configIn.amazonValidationHost;
        validationHost = VALIDATION_HOST;
    }
    verbose.setup(config);
};

module.exports.setup = function (cb) {
    if (!config || !config.secret) {
        return cb();
    }
    fs.exists(config.secret, function (exists) {
        var secret = '';
        if (!exists) {
            // use the string value literally
            secret = config.secret;
            VALIDATION_PATH = VALIDATION_PATH.replace(SECRET, config.secret);
            RENEW_PATH = RENEW_PATH.replace(SECRET, config.secret);
            verbose.log(NAME, 'Secret:', config.secret);
            return cb();
        }
        // assume it as a file path
        fs.readFile(config.secret, 'UTF-8', function (error, val) {
            if (error) {
                return cb(error);
            }
            secret = val.replace(/(\r|\n)/g, '');
            VALIDATION_PATH = VALIDATION_PATH.replace(SECRET, secret);
            RENEW_PATH = RENEW_PATH.replace(SECRET, secret);
            verbose.log(NAME, 'Secret:', secret);
            cb();
        });
    });
};

// test use ONLY
module.exports.setValidationHost = function (_validationHost) {
    validationHost = _validationHost;
    return true;
};

// test use ONLY...
module.exports.resetValidationHost = function () {
    validationHost = VALIDATION_HOST;
    return true;
};

/*
receipt: {
    userId: <user ID amazon in-app-purchase-server responds with>
    receiptId: <receipt ID from amazon>
}
*/
module.exports.validatePurchase = function (dSecret, receipt, cb) {
    var rpath = validationHost + RENEW_PATH;
    var path;

    // override secret with dSecret to allow dynamically fed secret to validate
    if (dSecret) {
        verbose.log(NAME, 'Use dynamically fed secret:', dSecret);
        rpath = S_R_PATH.replace(SECRET, dSecret);
        var vpath = S_VAL_PATH.replace(SECRET, dSecret);
        path = validationHost + vpath.replace(UID, receipt.userId);
    } else {
        path = validationHost + VALIDATION_PATH.replace(UID, receipt.userId);
    }
    path = path.replace(RID, receipt.receiptId);
    verbose.log(NAME, 'Validate:', path, receipt);
    send(path, ERRORS.VALIDATION, function (error, res) {
        if (error) {
            if (res === 499) {
                // must be renewed and re-tried
                var renew = rpath.replace(UID, receipt.userId);
                renew = renew.replace(RID, receipt.receiptId);
                verbose.log(NAME, 'Purchase must be renewed (' + res + '):', renew);
                send(renew, ERRORS.RENEW, function (error, renewed) {
                    if (error) {
                        var renewedErrorRes = {
                            status: renewed,
                            message: ERRORS.RENEW[renewed] || 'Unknown'
                        };
                        verbose.log(NAME, 'Failed to renew purchase:', renewedErrorRes);
                        return cb(error, renewedErrorRes);
                    }
                    var renewedReceipt = {
                        receiptId: renewed.receiptId,
                        userId: receipt.userId
                    };
                    verbose.log(NAME, 'Purchase renewed:', renewedReceipt);
                    module.exports.validatePurchase(renewedReceipt, cb);
                });
                return;
            }

            var errorRes = {
                sandbox: _isSandbox(path),
                status: res,
                message: ERRORS.VALIDATION[res] || 'Unknown'
            };
            verbose.log(NAME, 'Validation failed:', errorRes);
            return cb(error, errorRes);
        }
        verbose.log(NAME, 'Validation successful:', res);
        res.sandbox = _isSandbox(path);
        cb(null, res);
    });
};

function _isSandbox(path) {
    return path.indexOf(VALIDATION_HOST) === -1;
}

module.exports.getPurchaseData = function (purchase, options) {
    if (!purchase || !purchase.receiptId) {
        return null;
    }

    var now = Date.now();

    if (options && options.ignoreExpired && purchase.cancelDate && purchase.cancelDate <= now) {
        return [];
    }

    var obj = {};
    obj.transactionId = purchase.receiptId;
    obj.productId = purchase.productId;
    obj.purchaseData = purchase.productType;
    obj.quantity = 1;
    obj.purchaseDate = purchase.purchaseDate || now;
    obj.expirationDate = purchase.cancelDate || 0;
    return [ obj ];
};

function send(path, errorMap, cb) {
    request.get(path, function (error, response, body) {
        if (response) {
            var errorMsg = errorMap[response.statusCode];
            if (errorMsg) {
                return cb(new Error(errorMsg + ': ' + path), response.statusCode);
            }
        }
        if (error) {
            error.message += ': ' + path;
            return cb(error);
        }
        var res = null;
        try {
            res = JSON.parse(body);
            res.status = 0;
            res.service = constants.SERVICES.AMAZON;
        }
        catch (exc) {
            exc.message += ': ' + path + ' [status: ' + response.statusCode + ']';
            return cb(exc);
        }
        cb(null, res);
    });
}
