var verbose = require('./verbose');
var constants = require('../constants');
var responseData = require('./responseData');
var request = require('request');
var crypto = require('crypto');
var urlbase64 = require('urlsafe-base64');
var FB = require('fb');

const fb = new FB.Facebook({ version: 'v3.1' });

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
  if (config.facebookAppSecret && config.facebookAppId) {
    fb.setAccessToken(config.facebookAppId + '|' + config.facebookAppSecret);
  }

  return cb();
};

module.exports.validatePurchase = function (oneTimeSecret, receiptForLibrary, cb) {
  var appSecret;

  if (config && config.facebookAppSecret) {
    appSecret = config.facebookAppSecret;
  }

  if (oneTimeSecret) {
    verbose.log('<Facebook> Using dynamic app secret:', oneTimeSecret);
    appSecret = oneTimeSecret;
  }

  const receipt = receiptForLibrary.data;
  const userAccessToken = receiptForLibrary.access_token;
  const signAndRequest = receipt.split('.');
  const encodedSign = signAndRequest[0];
  const encodedPurchase = signAndRequest[1];

  // because urlbase64.decode executes decoding after triming encodedSign, check whether it involves non-urlbase64 character
  // encodedPurchase is not the case because crypto.createHmac makes non-urlbase64 characters into consideration.
  if (!urlbase64.validate(encodedSign)) {
    cb(new Error('failed to validate purchase: signature is not a valid urlsafe-base64 form'), { status: constants.VALIDATION.FAILURE });
    return;
  }

  let sign = "";
  let purchase = "";
  let purchaseObj = "";
  try {
    sign = urlbase64.decode(encodedSign);
    purchase = urlbase64.decode(encodedPurchase);
    purchaseObj = JSON.parse(purchase);
  } catch (e) {
    cb(new Error('failed to validate purchase: receipt is malformed'), { status: constants.VALIDATION.FAILURE });
    return;
  }

  if (signAndRequest.length !== 2) {
    cb(new Error('failed to validate purchase: involve dummy data'), { status: constants.VALIDATION.FAILURE });
    return;
  }
  if (purchaseObj.algorithm !== "HMAC-SHA256") {
    cb(new Error('failed to validate purchase: invalid algorithm'), { status: constants.VALIDATION.FAILURE });
    return;
  }
  if (purchaseObj.status != "completed") {
    cb(new Error('failed to validate purchase: payments not completed: ' + purchaseObj.status), { status: constants.VALIDATION.FAILURE });
    return;
  }

  const hmac = crypto.createHmac('sha256', appSecret).update(encodedPurchase).digest();

  if (!sign.equals(hmac)) {
    cb(new Error('failed to validate purchase: invalid sign'), { status: constants.VALIDATION.FAILURE });
    return;
  }
 
  fb.api(purchaseObj.payment_id + '?', 'get', { fields: 'id,user,actions,application,created_time,country,items,payout_foreign_exchange_rate,phone_support_eligible,refundable_amount,tax,tax_country,test' }, function (paymentRes) {
    if (!paymentRes || paymentRes.error) {
      cb(new Error('failed to validate purchase: graph api call error: ' + JSON.stringify(paymentRes.error)), { status: constants.VALIDATION.FAILURE, message: paymentRes.error });
      return;
    }
    if (purchaseObj.amount !== paymentRes.actions[0].amount ||
        purchaseObj.currency !== paymentRes.actions[0].currency ||
        purchaseObj.status !== paymentRes.actions[0].status ||
        paymentRes.actions[0].type !== 'charge' ||
        purchaseObj.quantity != paymentRes.items[0].quantity) {
      cb(new Error('failed to validate purchase: payment information not matching'), { status: constants.VALIDATION.FAILURE });
      return;
    }
    fb.api(purchaseObj.purchase_token + '/consume', 'post', { access_token: userAccessToken }, function (consumeRes) {
      // do not care consume result (might be consumed by client-side reclaim consume, consume is just sign of aknowledgement for request)
      purchaseObj.service = constants.SERVICES.FACEBOOK;
      purchaseObj.status = constants.VALIDATION.SUCCESS;
      cb(null, purchaseObj);
      return;
    });
  });
};

module.exports.getPurchaseData = function (purchase, options) {
  if (!purchase) {
    return null;
  }
  var data = [];
  var purchaseInfo = responseData.parse(purchase);
  purchaseInfo.transactionId = purchase.payment_id;
  data.push(purchaseInfo);
  return data;
};
