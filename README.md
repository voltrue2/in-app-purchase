# in-app-purchase

©Nobuyori Takahashi < <voltrue2@yahoo.com> >

[![Build Status](https://travis-ci.org/voltrue2/in-app-purchase.svg?branch=master)](https://travis-ci.org/voltrue2/in-app-purchase)

A Node.js module for In-App-Purchase validation for iOS, Android, Amazon, and Windows.

It can also validate multiple app's receipt with a single back-end using `.validateOnce()` that allows you to change `secret` or `public key` dynamically.

### Required node.js Version

`0.12.0 >=`

### Online Demo and Doc

<a href="http://iap.gracenode.org" target="_blank">Online Demo</a>

### Auto-service detection has been added

You no longer need to pass `iap.APPLE`, `iap.GOOGLE`, `iap.AMAZON`, or `iap.WINDIWS`.

The module automatically detects the service without you telling it!

For more details: [HERE](#auto-service-detection)

### Support for Unity Receipts

As of version `1.7.0`, the module supports Unity receipts. [Unity Purchase](https://docs.unity3d.com/Manual/UnityIAPPurchaseReceipts.html)

The receipt is a JSON that looks like as below:

```
{ "Store": "AppleAppStore", "Payload": "Apple Receipt" }
```

```javascript
const iap = require('in-app-purchase');
iap.validate(unityReceipt, () => {
	...
});
```

### Support for Promise

The following methods now support Promise.

Thanks to [superandrew213](https://github.com/superandrew213) for the [PR](https://github.com/voltrue2/in-app-purchase/pull/99).

- `.setup()`

- `.validate()`

- `.validateOnce()`

- `.refreshGoogleToken()`

### Debug Logging

The module can optionally turn on verbose debug log.

In order to enable the verbose logging, give the following to `.config()` **BEFORE** calling `.setup([callback])`:

```javascript
var iap = require('in-app-purchase');
iap.config({
	verbose: true
});
```

### Test Mode

For Apple and Google, the module can run in test mode so that it skipps production validation.

To enable test mode, set the following value to your configurations:

```javascript
var iap = require('in-app-purchase');
iap.config({
	test: true
});
```

### Google Play Subscriptions

As of version `1.6.0`, the module now automatically detects subscription receipts and validates them accordingly.

In order to make this work properly, you must provide the following:

```
iap.config({
	googleClientID: '<Google Play client ID>',
	googleClientSecret: '<Google Play client secret>',
	googleRefToken: '<Google Play refresh token>'
});
```

**NOTE**: `googleAccToken` is not required.

This also makes `.isExpired()` compatible with Google Play purchases.

**TODO**: 

As of version `1.6.1` `.validateOnce(...)` supports this by giving:

```javascript
const params = {
	clientId: '<Google Play client ID>',
	clientSecret: '<Google Play client secret>',
	refreshToken: '<Google Play refresh token>'
};
iap.validateOnce(receipt, params, (...) => {
	// do things..
});
``` 

### .getPurchaseData() w/ ignoreExpired for Android works

As of version `1.6.1`, `ignoreExpired` options for Android is supported. 

### Methods

#### .validate(service [constant], receipt [string or object], callback [function])

Validates an in-app-purchase receipt.

**NOTE 1:**

constant for Unity: `iap.UNITY`

constant for iOS: `iap.APPLE`

constant for Android: `iap.GOOGLE`

constant for Windows: `iap.WINDOWS`

constant for Amazon: `iap.AMAZON`

As of version 1.4.0, we now have built-in auto-service detection in `.validate(receipt, callback)` and `.validateOnce(receipt, secretPubKey, callback)`.

For more detail please read [here](#auto-service-detection)

- For Apple validation, receipt is a base64 encoded string.

- For Google validation, receipt is an object `{ data: "stringified purchase data", signature: "yyyy" }`.

- For Windows validation, receipt is a signed XML string.

- For Amazon validation, receipt is an object `{ userId: "xxx", receiptId: "yyyy" }`. `receiptId` is a ``purchaseToken sent from Amazon app store server.

**NOTE 2:**

Validation error will have a response object as `{ status: <status code>, message: <message string> }`.

**NOTE 3:**

For Google Play validation, the `data` must be a string, but if you pass it as an object, the module can automatically correct the data format and validate it still.

**NOTE 4:**

For Apple purchase, if `in_app` in the validated receipt is empty, the module considers invalid since the receipt indicates that the user purchased nothing:

Related reads:

<a href="https://forums.developer.apple.com/thread/8954">Apple Developer Thread 8954</a>

<a href="https://developer.apple.com/library/mac/technotes/tn2413/_index.html#//apple_ref/doc/uid/DTS40016228-CH1-RECEIPT-HOW_DO_I_USE_THE_CANCELLATION_DATE_FIELD_">Apple Purchase</a>

#### .validateOnce(service [constant], secretOrPubKey [string], receipt [string or object], callback [function]);

Validates an in-app-purchase receipt with a dynamically fed secret or public key. 

This is usefuly when you need to validate multiple apps' receipts with a single back-end.

<a name="auto-service-detection"></a>
## Detect service automatically

`in-app-purchase` module now supports auto-service detection as of version 1.4.0.

Here is how it works:

Instead of passing `iap.APPLE`, `iap.GOOGLE`, `iap.AMAZON`, or `iap.WINDOWS` to `iap.validate()` and `iap.validateOnce()`, you may write:

### .validate(receipt [mixed], callback [Function])

```javascript
.validate(receipt, function (...) {
	// do something
});
```

### .validateOnce(receipt [mixed], params [mixed], callback [function])

#### params [mixed]

For Apple subscription, set params as a `string` of shared password.

For Google Play subscription, set params as an `object` of `{ clientId, clientSecret, refreshToken }`.

```javascript
.validateOnce(receipt, params, function (...) {
	// do something
})
```

### .getService(receipt [mixed])

Returns a service name from the given receipt.

#### .isValidated(response [object])

Returns a boolean.

#### .getPurchaseData(response [object], options [*object]);

Returns a parsed purchase data as an array.

For apple and windows, the returned array may contain more than 1 purchase data.

For Windows purchase data and Apple iTunes (recurring subscription only), each purchase data in the array contains `expirationDate`.

For Google Play purchases (recurring subscription only), each purchase data in the array contains `expirationDate` only if you provide google play store information.

#### .refreshGoogleToken(callback [function]);

**For Android only!**

Returns a callback function with `error` and `response` as arguments.

This method should be used when trying to query the Google Play Store API, but the access token is no longer valid.


##### Options

```
{
    ignoreExpired: <boolean>
}
```

**ignoreExpired**: If `true`, the function will exclude expired items from the return array.

This is only for `windows` and `apple` iTunes (recurring subscription only).

**NOTE:** For Apple, if the item is NOT a recurring purchase, then `expirationDate` is `0`.

The purchase data structure is:

```
{
    bundleId: <string>, // Apple only
    orderId: <string>, // Google only
    transactionId: <string>,
    productId: <string>,
    purchaseDate: <number>,
    quantity: <number>,
    *expirationDate: <number> // iTunes, windows and amazon subscription only. Google subscriptions only with google play store api info
}
```

Example:

```javascript
iap.setup(function (error) {
    if (error) {
        // error hmm
    }
    iap.validate(iap.APPLE, receipt, function (error, response) {
        if (error) {
            // error
        }
        if (iap.isValidated(response)) {
            var purchaseDataList = iap.getPurchaseData(response);
            /*
                [
                    {
                        productId: xxx,
                        purchasedDate: yyy,
                        quantity: zzz
                    }
                ]
            */
        }
    });
});
```

#### .isExpired(purchaseDataItem [object])

Returns `true` if a purchased item has been expired.

**NOTE:** This function is for `windows` and `apple` iTunes (recurring subscription only). This can also be used for `google` subscriptions since you provide google play store api information.


Example For Checking Expiration Manually:

```javascript
iap.setup(function (error) {
    if (error) {
        // handle error properly here
    }
    iap.validate(iap.APPLE, receipt, function (error, response) {
        if (error) {
            // oh no error...
        }
        if (iap.isValidated(response)) {
            // now check if any of the items validated has been expired or not
            var purchaseDataList = iap.getPurchaseData(response);
            for (var i = 0, len = purchaseDataList.length; i < len; i++) {
                if (iap.isExpired(purchaseDataList[i])) {
                    // this item has been expired...
                }
            }
        }
    });
});
```

Example For Ignoring Expired Items:

```javascript
iap.setup(function (error) {
    if (error) {
        // handle error properly here
    }
    iap.validate(iap.APPLE, receipt, function (error, response) {
        if (error) {
            // oh no error...
        }
        if (iap.isValidated(response)) {
            // get the purchased items that have not been expired ONLY
            var options = {
                ignoreExpired: true
            };
            var purchaseDataList = iap.getPurchaseData(response, options);
        }
    });
});
```

### Apple Recurring Purchase Password

For iTunes subscription purchases, a shared password is required.

### GooglePlay Public Key From Files

For GooglePlay, `in-app-purchase` module needs to have the public key file(s).

The module requires the file(s) to be name in a certain way:

For sandbox, the file name should be: `iap-sandbox`.

For production, the file name should be: `iap-live`.

### Public Key File(s)

Google Play has only one public key for both production and sandbox, but the module gives you an option to separate the public keys for development and testing.

If you do not need to have different public keys, simply use the same public key in both files.

### Configurations

The module needs to call `.config()` before it can execute `.setup()` correctly.

Example:

```
var inAppPurchase = require('in-app-purchase');
inAppPurchase.config({
    amazonAPIVersion: 2,
    secret: "abcdefghijklmnoporstuvwxyz", // this comes from Amazon
    applePassword: "1234567890abcdef1234567890abcdef", // this comes from iTunes Connect
    googlePublicKeyPath: "path/to/public/key/directory/" // this is the path to the directory containing iap-sanbox/iap-live files
});
```

#### Amazon API Version

You may add `amazonAPIVersion: 2` to your configuration to enable Amazon API version 2.

The default is version 1.

#### HTTP Request Configuration

The module utilises the Request module for the HTTP requests required to validate Apple and Windows IAP subscriptions. The default settings for requests can be configured by passing in the `requestDefaults` configuration property. This allows you to configure proxies, tunnels and request timeouts. This object can contain any [Request module options](https://github.com/request/request#requestoptions-callback) but may be overridden by request-specific options set by this module.

Example:

```javascript
// set timeout to be 5 seconds
iap.config({
    requestDefaults: {
        timeout: 5000
    }
});
```

### GooglePlay Public Key From Environment Variables

For GooglePlay, `in-app-purchase` module can read public key value from the environment variables instead of file(s).

The basics is the same as using file(s).

You will need to set the public key value, which is the same value as you would save as a file, to environment variables.

#### GOOGLE_IAB_PUBLICKEY_SANDBOX

This would be the public key value for sandbox.

`export=GOOGLE_IAB_PUBLICKEY_SANDBOX=xxx`.

#### GOOGLE_IAB_PUBLICKEY_LIVE

This would be the public key value for live

`export=GOOGLE_IAB_PUBLICKEY_LIVE=yyy`.

**NOTE**: This works exactly the same as you were to use file(s) with one expection. You do **NOT** need to call `.config()` for GooglePlay since it will be using environment variables instead.

### GooglePlay Public Key As String

The module also allows you to feed GooglePlay public key value as string. For example, you may store the key value in a database and read from it to use it etc.

Example:

```
var iap = require('in-app-purchase');
iap.config({
    googlePublicKeyStrSandbox: publicKeySandboxString,
    googlePublicKeyStrLive: publicKeyLiveString
});
//... proceed with the rest of your code here
```

### How To Use It

Example: Apple

```javascript
var iap = require('in-app-purchase');
iap.config({
    applePassword: "1234567890abcdef1234567890abcdef"
});
iap.setup(function (error) {
    if (error) {
        return console.error('something went wrong...');
    }
    // iap is ready
    iap.validate(iap.APPLE, appleReceipt, function (err, appleRes) {
        if (err) {
            return console.error(err);
        }
        if (iap.isValidated(appRes)) {
            // yay good!
        }
    });
});
```

Example: Google

```javascript
var iap = require('in-app-purchase');
/*
For google iap, you need to name your public key file as:
iap-sanbox or iap-live
*/
iap.config({
    googlePublicKeyPath: "/path/to/google/public/key/dir/"
});
iap.setup(function (error) {
    if (error) {
        return console.error('something went wrong...');
    }
    /*
        google receipt must be provided as an object
        {
            "data": "{stringified data object}",
            "signature": "signature from google"
        }
    */
    // iap is ready
    iap.validate(iap.GOOGLE, googleReceipt, function (err, googleRes) {
        if (err) {
            return console.error(err);
        }
        if (iap.isValidated(googleRes)) {
            // yay good!
        }
    });
});
```

Example: Amazon

```javascript
iap.config({
	secret: 'shared secret from Amazon'
});
iap.setup(function (error) {
    if (error) {
        // oh no...
    }
    iap.validate(iap.AMAZON, amazonReceipt, function (err, response) {
        if (err) {
            return console.error(err);
        }
        if (iap.isValidated(response)) {
            // goody validated
        }
    });
});
```

Example: Windows

```javascript
var iap = require('in-app-purchase');
iap.setup(function (error) {
    if (erorr) {
        // oops
    }
    iap.validate(iap.WINDOWS, windowsReceipt, function (err, windowsRes) {
        if (err) {
            // failed to validate the purchase
        }
        if (iap.isValidated(windowsRes)) {
            // yay good!
        }
    });
});
```
## Google Play Store API

You can use Google Play Store API to check the state of a subscription (if the subscription is still valid, auto-renewal, etc). To do so, you need to setup iap module with Google Play Store API Information.

Example:

```javascript
iap.config({
        googlePublicKeyPath: "/path/to/google/public/key/dir/",
        googleAccToken: "PLAY_STORE_API_ACCESS_TOKEN",
        googleRefToken: "PLAY_STORE_API_REFRESH_TOKEN",
        googleClientID: "PLAY_STORE_API_CLIENT_ID",
        googleClientSecret: "PLAY_STORE_API_CLIENT_SECRET"
});

iap.setup(function (error) {
    if (error) {
        // error hmm
    }
    iap.validate(iap.GOOGLE, receipt, function (error, response) {
        if (error) {
            // error
        }
        if (iap.isValidated(response)) {
            var purchaseDataList = iap.getPurchaseData(response);
            /*
                [
                    {
                        productId: xxx,
                        purchasedDate: yyy,
                        quantity: zzz
                    }
                ]
            */
        }
    });
});
```
**NOTE:** If one of the keys (`googleAccToken`, `googleRefToken`, `googleClientID` or `googleClientSecret`) is missing in the `config()` function, iap module will only perform the validation of the receipt, and won't do any check using Google Play Store API.

## Google In-app-Billing Set Up

To set up your server-side Android in-app-billing correctly, you must provide the public key string as a file from your Developer Console account.

**Reference:** <a href="https://developer.android.com/google/play/billing/billing_integrate.html#billing-security">Implementing In-app Billing</a>

Once you copy the public key string from the Developer Console account for your application, you simply need to copy and paste it to a file and name it `iap-live` as shown in the example above.

**NOTE:** The public key string you copy from the Developer Console account is actually a base64 string. You do NOT have to convert this to anything yourself. The module converts it to the public key automatically for you.

### Google Play Store API

To check expiration date or auto renewal status of an Android subscription, you should first setup the access to the Google Play Store API. You should follow these steps:

##### Part 1 - Get ClientID and ClientSecret
1. Go to https://play.google.com/apps/publish/
2. Click on `Settings`
3. Click on `API Access`
4. There should be a linked project already, if not, create one. If you have it, click it.
* You should now be at: https://console.developers.google.com/apis/library?project=xxxx
5. Under Mobile API's, make sure "Google Play Developer API is enabled".
6. Go back, on the left click on `Credentials`
7. Click `Create Credentials` button
8. Choose `OAuth Client ID`
9. Choose `Web Application`
 * Give it a name, skip the `Authorized JS origins`
 * Aadd this to `Authorized Redirect URIs`: https://developers.google.com/oauthplayground
 * Hit Save and copy the **clientID** and **clientSecret** somewhere safe.

##### Part 2 - Get Access and Refresh Tokens
1. Go to: https://developers.google.com/oauthplayground
2. On the right, hit the gear/settings.
3. Check the box: `Use your own OAuth credentials`
	* Enter in clientID and clientSecret
	* Close
4. On the left, find "Google Play Developer API v2"
 * Select "https://www.googleapis.com/auth/androidpublisher"
5. Hit Authorize Api's button
6. Save `Authorization Code` 
 * This is your: **googleAccToken**
7. Hit `Exchange Authorization code for token`
8. Grab: `Refresh Token`
 * This is your: **googleRefToken**

Now you are able to query for Android subscription status!

## Amazon App Store Reference

https://developer.amazon.com/appsandservices/apis/earn/in-app-purchasing/docs/rvs

***

## Windows Signed XML

in-app-purchase module supports the following algorithms:

### Canonicalization and Transformation Algorithms

- Exclusive Canonicalization http://www.w3.org/2001/10/xml-exc-c14n#

- Exclusive Canonicalization with comments http://www.w3.org/2001/10/xml-exc-c14n#WithComments

- Enveloped Signature transform http://www.w3.org/2000/09/xmldsig#enveloped-signature

### Hashing Algorithms

- SHA1 digests http://www.w3.org/2000/09/xmldsig#sha1

- SHA256 digests http://www.w3.org/2001/04/xmlenc#sha256

- SHA512 digests http://www.w3.org/2001/04/xmlenc#sha512

***

## Test

`in-app-purchase` module provides unit tests. In order the make use of the unit tests, you must provide receipts for iOS/Android in files.

To test the module you may execute the following commands in the root directory of the module:

#### For iOS:

```
make test-apple path=/path/to/your/apple/receipt/file
```

#### For Android:

In order to test google's in-app-billing, you must provide the public key file in addition to your google receipt file.

NOTE: the receipt file for google must contain javascript object format something similar to:

```
{"data":"google sent data","signature":"signature string"}
```

```
make test-google path=/path/to/your/google/receipt/file pk=/path/you/the/directory/of/your/google/public/key/
```

#### For Windows:

In order to test windows' in-app-purchase, you must provide the signed receipt XML as a file.

```
make test-windows path=/path/to/your/windows/receipt/xml
```
