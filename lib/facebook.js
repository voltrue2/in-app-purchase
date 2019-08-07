var verbose = require('./verbose');
var constants = require('../constants');
var responseData = require('./responseData');
var request = require('request');
var crypto = require('crypto');
var urlbase64 = require('urlsafe-base64');
var FB = require('fb');

var fb = new FB.Facebook({ version: 'v3.3' });

var config = null;

function isValidConfigKey(key) {
    return key.match(/^facebook/);
}

module.exports.readConfig = function (configIn) {
    if (!configIn) {
        // no facebook iap or password not required
        return;
    }
    
    // set up verbose logging
    verbose.setup(configIn);
    
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
    if (configIn.facebookAppSecret && configIn.facebookAppId) {
        fb.setAccessToken(configIn.facebookAppId + '|' + configIn.facebookAppSecret);
    }
    
    if (!configValueSet) {
        config = null;
    }
};

module.exports.setup = function (cb) {
    if (!config || !config.facebookAppSecret || !config.facebookAppId) {
        if (process.env.FACEBOOK_APP_SECRET) {
            config = config || {};
            config.facebookAppSecret = process.env.FACEBOOK_APP_SECRET;
        }
        if (process.env.FACEBOOK_APP_ID) {
            config = config || {};
            config.facebookAppId = process.env.FACEBOOK_APP_ID;
        }
    }
    
    return cb();
};

module.exports.validatePurchase = function (oneTimeAppAccessToken, receipt, cb) {
    var appId = config.facebookAppId;
    var appSecret = config.facebookAppSecret;
    
    if (oneTimeAppAccessToken) {
        verbose.log('<Facebook> Using dynamic app access token:', oneTimeAppAccessToken);
        var splitedToken = oneTimeAppAccessToken.split('|');
        appId = splitedToken[0];
        appSecret = splitedToken[1];
    }
    
    // see "Order Fulfillment" to understand what following steps are at https://developers.facebook.com/docs/games_payments/fulfillment#orderfulfillment
    verbose.log('<Facebook> Validate signed_request: ', receipt);
    var signAndRequest = receipt.split('.');
    var encodedSign = signAndRequest[0];
    var encodedPurchase = signAndRequest[1];
    
    if (signAndRequest.length !== 2) {
        verbose.log('<Facebook> Receipt involves unrelated data');
        cb(new Error('failed to validate purchase: involve unrelated data'), {
            status: constants.VALIDATION.FAILURE,
            message: 'involve unrelated data'
        });
        return;
    }
    
    // because urlbase64.decode executes decoding after triming encodedSign, check whether it involves non-urlbase64 character
    // encodedPurchase is not the case because crypto.createHmac makes non-urlbase64 characters into consideration.
    if (!urlbase64.validate(encodedSign)) {
        verbose.log('<Facebook> Sign is not urlsafe-base64 encoded');
        cb(new Error('failed to validate purchase: signature is not a valid urlsafe-base64 form'), {
            status: constants.VALIDATION.FAILURE,
            message: 'signature is not a valid urlsafe-base64 form'
        });
        return;
    }
    
    var sign = '';
    var purchase = '';
    var purchaseObj = '';
    try {
        sign = urlbase64.decode(encodedSign);
        purchase = urlbase64.decode(encodedPurchase);
        purchaseObj = JSON.parse(purchase);
    } catch (e) {
        verbose.log('<Facebook> Failed to parse receipt: ', e);
        cb(new Error('failed to validate purchase: receipt is malformed'), {
            status: constants.VALIDATION.FAILURE,
            message: 'receipt is malformed'
        });
        return;
    }
    
    if (purchaseObj.algorithm !== 'HMAC-SHA256') {
        verbose.log('<Facebook> Receipt sign algorithm is not HMAC-SHA256');
        cb(new Error('failed to validate purchase: invalid algorithm'), {
            status: constants.VALIDATION.FAILURE,
            message: 'invalid algorithm'
        });
        return;
    }
    if (purchaseObj.status !== 'completed') {
        verbose.log('<Facebook> Receipt status is not completed');
        cb(new Error('failed to validate purchase: payments not completed: ' + purchaseObj.status), {
            status: constants.VALIDATION.FAILURE,
            message: 'payments not completed: ' + purchaseObj.status
        });
        return;
    }
    
    var hmac = crypto.createHmac('sha256', appSecret).update(encodedPurchase).digest();
    
    if (!sign.equals(hmac)) {
        verbose.log('<Facebook> Sign is invalid');
        cb(new Error('failed to validate purchase: invalid sign'), {
            status: constants.VALIDATION.FAILURE,
            message: 'invalid sign'
        });
        return;
    }

    var requestParams = {
        fields: 'id,user,actions,application,created_time,country,items,payout_foreign_exchange_rate,phone_support_eligible,refundable_amount,tax,tax_country,test',
        access_token: appId + '|' + appSecret, // eslint-disable-line camelcase
    };
    fb.api(purchaseObj.payment_id + '?', 'get', requestParams, function (paymentRes) {
        if (!paymentRes || paymentRes.error) {
            verbose.log('<Facebook> Failed to call graph api: ', paymentRes);
            paymentRes = paymentRes || {};
            cb(new Error('failed to validate purchase: graph api call error: ' + JSON.stringify(paymentRes.error)), {
                status: constants.VALIDATION.FAILURE,
                message: 'graph api call error: ' + JSON.stringify(paymentRes.error)
            });
            return;
        }
        var quantityNum = Number(purchaseObj.quantity);
        if (purchaseObj.amount !== paymentRes.actions[0].amount ||
            purchaseObj.currency !== paymentRes.actions[0].currency ||
            purchaseObj.status !== paymentRes.actions[0].status ||
            paymentRes.actions[0].type !== 'charge' ||
            quantityNum !== paymentRes.items[0].quantity) {
            verbose.log('<Facebook> Receipt info does not match with info from facebook');
            cb(new Error('failed to validate purchase: payment information not matching'), {
                status: constants.VALIDATION.FAILURE,
                message: 'payment information not matching'
            });
            return;
        }
        purchaseObj.service = constants.SERVICES.FACEBOOK;
        purchaseObj.status = constants.VALIDATION.SUCCESS;
        verbose.log('<Facebook> Validation success: ', purchaseObj);
        cb(null, purchaseObj);
        return;
    });
};

module.exports.getPurchaseData = function (purchase) {
    if (!purchase) {
        return null;
    }
    var data = [];
    var purchaseInfo = responseData.parse(purchase);
    // purchase(singed_request) already has product_id and quantity
    purchaseInfo.transactionId = purchase.payment_id;
    purchaseInfo.purchaseDate = purchase.purchase_time * 1000;
    data.push(purchaseInfo);
    return data;
};
