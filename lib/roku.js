var constants = require('../constants');
var request = require('request');
var responseData = require('./responseData');
var verbose = require('./verbose');

var API_KEY = '{apiKey}';
var TRANSACTION_ID = '{transactionId}';

var VALIDATION_PATH = 'https://apipub.roku.com/listen/transaction-service.svc/validate-transaction/' + API_KEY + '/' + TRANSACTION_ID;

var NAME = '<Roku>';

var config;

module.exports.readConfig = function (configIn) {
    config = configIn || {};
    // apply configurations
    if (config.requestDefaults) {
        request = request.defaults(config.requestDefaults);
    }
    verbose.setup(config);
};

/*
https://sdkdocs.roku.com/display/sdkdoc/Web+Service+API#WebServiceAPI-ValidateTransaction
receipt: <transaction ID from roku>
*/
module.exports.validatePurchase = function (apiKey, receipt, cb) {
    var path;
    var characters = receipt.match(/\w/g) || '';
    var dashes = receipt.match(/-/g) || '';
    if (characters.length !== 32) {
        return cb(new Error('Receipt must contain 32 digits'));
    } else if (dashes.length !== 4) {
        return cb(new Error('Receipt must contain 4 dashes'));
    }

    // override rokuApiKey from config to allow dynamically fed secret to validate
    if (apiKey) {
        verbose.log(NAME, 'Use dynamically rokuApiKey:', apiKey);
        path = VALIDATION_PATH.replace(API_KEY, apiKey);
    } else {
        path = VALIDATION_PATH.replace(API_KEY, config.rokuApiKey);
    }
    path = path.replace(TRANSACTION_ID, receipt);
    verbose.log(NAME, 'Validate:', path, receipt);
    send(path, function (error, res) {
        if (error) {
            verbose.log(NAME, 'Validation failed:', error.message);
            return cb(error);
        }
        verbose.log(NAME, 'Validation successful:', res);
        cb(null, res);
    });
};

module.exports.getPurchaseData = function (purchase, options) {
    if (!purchase || !purchase.transactionId) {
        return null;
    }
    
    var now = Date.now();

    if (options && options.ignoreExpired && purchase.expirationDate <= now) {
        return [];
    }
    
    var obj = responseData.parse(purchase);
    // obj.transactionId = purchase.transactionId;
    // obj.productId = purchase.productId;
    // obj.quantity = 1;
    // obj.purchaseDate = purchase.startDate || now;
    // obj.expirationDate = purchase.expirationDate || 0;
    return [ obj ];
};

function send(path, cb) {
    var options = {
        uri: path,
        json: true
    };
    request.get(options, function (error, response, body) {
        if (error) {
            return cb(error, {
                status: constants.VALIDATION.FAILURE,
                message: error.message || 'Unknown'
            });
        }
        if (response.statusCode !== 200) {
            return cb(error, {
                status: constants.VALIDATION.FAILURE,
                message: body
            });
        }

        var res = body;
        if (res.errorMessage) {
            return cb(new Error(res.errorMessage), {
                status: constants.VALIDATION.FAILURE,
                message: res.errorMessage
            });
        }

        // parse non-standard date properties (i.e. /Date(1483242628000-0800)/)
        // in order to extract value by milliseconds
        if (res.expirationDate) {
            res.expirationDate = new Date(parseInt(res.expirationDate.substr(6), 10)).getTime();
        }
        res.originalPurchaseDate = new Date(parseInt(res.originalPurchaseDate.substr(6), 10)).getTime();
        res.purchaseDate = new Date(parseInt(res.purchaseDate.substr(6), 10)).getTime();

        res.status = 0;
        res.service = constants.SERVICES.ROKU;
        cb(null, res);
    });
}
