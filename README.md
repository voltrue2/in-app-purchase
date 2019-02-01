![Logo](https://user-images.githubusercontent.com/2267361/42299566-e25ee852-8046-11e8-9cc3-a776770fcc8e.png)

©Nobuyori Takahashi < <voltrue2@yahoo.com> >

[![Build Status](https://travis-ci.org/voltrue2/in-app-purchase.svg?branch=master)](https://travis-ci.org/voltrue2/in-app-purchase)

A node.js module for in-app purchase (in-app billing) and subscription for Apple, Google Play, Amazon Store, Roku, and Windows.

It supports Unity receipt also: [Unity Documentation](https://docs.unity3d.com/Manual/UnityIAPValidatingReceipts.html)

**NOTE** Unity receipt supports the following: Apple, Google Play, and Amazon.

## What is new

As of version `1.10.0`, The module lets you validate Google's receipts using Google Service Account also!

Thank you for the input [maxs15](https://github.com/maxs15)

## Required node.js version

`0.12.0 >=`

## Online Demo and Documention

<a href="http://iap.gracenode.org" target="_blank">Online Demo</a>

## How to install

```
npm install in-app-purchase
```

## How to use

The module supports both Promise and callbacks.

```javascript
var iap = require('in-app-purchase');
iap.config({

    /* Configurations for HTTP request */
    requestDefaults: { /* Please refer to the request module documentation here: https://www.npmjs.com/package/request#requestoptions-callback */ },

    /* Configurations for Amazon Store */
    amazonAPIVersion: 2, // tells the module to use API version 2
    secret: 'abcdefghijklmnoporstuvwxyz', // this comes from Amazon
    // amazonValidationHost: http://localhost:8080/RVSSandbox, // Local sandbox URL for testing amazon sandbox receipts.

    /* Configurations for Apple */
    appleExcludeOldTransactions: true, // if you want to exclude old transaction, set this to true. Default is false
    applePassword: 'abcdefg...', // this comes from iTunes Connect (You need this to valiate subscriptions)

    /* Configurations for Google Service Account validation: You can validate with just packageName, productId, and purchaseToken */
    googleServiceAccount: {
        clientEmail: '<client email from Google API service account JSON key file>',
        privateKey: '<private key string from Google API service account JSON key file>'
    },

    /* Configurations for Google Play */
    googlePublicKeyPath: 'path/to/public/key/directory/', // this is the path to the directory containing iap-sanbox/iap-live files
    googlePublicKeyStrSandBox: 'publicKeySandboxString', // this is the google iap-sandbox public key string
    googlePublicKeyStrLive: 'publicKeyLiveString', // this is the google iap-live public key string
    googleAccToken: 'abcdef...', // optional, for Google Play subscriptions
    googleRefToken: 'dddd...', // optional, for Google Play subscritions
    googleClientID: 'aaaa', // optional, for Google Play subscriptions
    googleClientSecret: 'bbbb', // optional, for Google Play subscriptions

    /* Configurations for Roku */
    rokuApiKey: 'aaaa...', // this comes from Roku Developer Dashboard

    /* Configurations all platforms */
    test: true, // For Apple and Googl Play to force Sandbox validation only
    verbose: true // Output debug logs to stdout stream
});
iap.setup()
  .then(() => {
    // iap.validate(...) automatically detects what type of receipt you are trying to validate
    iap.validate(receipt).then(onSuccess).catch(onError);
  })
  .catch((error) => {
    // error...
  });

function onSuccess(validatedData) {
    // validatedData: the actual content of the validated receipt
    // validatedData also contains the original receipt
    var options = {
        ignoreCanceled: true, // Apple ONLY (for now...): purchaseData will NOT contain cancceled items
        ignoreExpired: true // purchaseData will NOT contain exipired subscription items
    };
    // validatedData contains sandbox: true/false for Apple and Amazon
    var purchaseData = iap.getPurchaseData(validatedData, options);
}

function onError(error) {
    // failed to validate the receipt...
}
```

## Receipt data format

### Apple

An Apple's receipt is a base64 encoded string.

### Google Play

A Google Play's receipt consists of two components.

- Signed Data: A JSON data of what the end user purchased.

- Signature: A base64 encoded string.

The module requires the above two compoents to be as a JSON object.

```
{
    "data": {Signed Data JSON},
    "signature": "Base 64 encoded signature string"
}
```

`data` property in the receipt object can be either an object or a stringified JSON string.

### Google Play Using Google Service Account

If you are using Google service account instead of OAuth for Google, the receipt should look like:

The API used is v3.

```
{
    packageName: 'The packge name of the item purchased',
    productId: 'The product ID of the item purchased',
    purchaseToken: 'PurchaseToken of the receipt from Google',
    subscription: true/false // if the receipt is a subscription, then true
}
```

### Google Play Using Google Service Account (with Unity receipt)

If you are using Google service account with unity receipt, you need to add a 'Subscription' field to your unity receipt.
The receipt should look like:

```
{
    Store: 'The name of the store in use, such as GooglePlay or AppleAppStore',
    TransactionID: 'This transaction's unique identifier, provided by the store',
    Payload: 'Varies by platform, see [Unity Receipt Documentation](https://docs.unity3d.com/Manual/UnityIAPPurchaseReceipts.html)',
    Subscription: true/false // if the receipt is a subscription, then true
}
```

### Amazon

An Amazon's receipt contains the following:

- User ID: A string of Amazon Store user ID.

- Receipt ID: A string of Amazon receipt.

The module requires the above two components to be as a JSON object or a string

```
{
    "userId": "User ID",
    "receiptId": "Receipt ID"
}
```

### Roku

A Roku's receipt is a transaction ID string.

### Windows

A Windows' receipt is an XML string.

## Validate Receipts From Multiple Applications

You may feed different Google public key or Apple password etc to validate receipts of different applications with the same code:

### Windows is NOT Supported

### Google Public Key

```javascript
iap.config(configObject);
iap.setup()
  .then(() => {
    iap.validateOnce(receipt, pubKeyString).then(onSuccess).catch(onError);
  })
  .catch((error) => {
    // error...
  });
```

### Google Subscription

```javascript
iap.config(configObject);
iap.setup()
  .then(() => {
    var credentials = {
      clientId: 'xxxx',
      clientSecret: 'yyyy',
      refreshToken: 'zzzz'
    };
    iap.validateOnce(receipt, credentials).then(onSuccess).catch(onError);
  })
```

### Apple Subscription

```javascript
iap.config(configObject);
iap.setup()
  .then(() => {
    iap.validateOnce(receipt, appleSecretString).then(onSuccess).catch(onError);
  })
  .catch((error) => {
    // error...
  });
```

### Amazon

```javascript
iap.config(configObject);
iap.setup()
  .then(() => {
    iap.validateOnce(receipt, amazonSecretString).then(onSuccess).catch(onError);
  })
  .catch((error) => {
    // error...
  });
```

### Roku

```javascript
iap.config(configObject);
iap.setup()
  .then(() => {
    iap.validateOnce(receipt, rokuApiKeyString).then(onSuccess).catch(onError);
  })
  .catch((error) => {
    // error...
  });
```

## Helper Methods

### Array<[object]> getPurchaseData([object] response, [object] options)

Returns an Array of objects that to be used by `isExpired` and `isCanceled`.

#### [bool] options.ignoreCanceled

If `true`, the returned purchaseData excludes canceled item(s).

#### [bool] options.ignoreExpired

If `true`, the returned purchaseData excludes expired item(s).

### [bool] isValidated([object] response)

Returns a boolean `true` if the given response of a receipt validation is a valid.

```javascript
iap.validate(receipt)
    .then((response) => {
        if (iap.isValidated(response)) {
            // valid receipt
        }
    })
    .catch((error) => {
        // error...
    });
```

### [bool] isCanceled([object] purchaseData)

Returns a boolean `true` if a canceled receipt is validated.

```javascript
iap.validate(receipt)
    .then((response) => {
        var purchaseData = iap.getPurchaseData(response);
        if (iap.isCanceled(purchaseData[0])) {
            // receipt has been canceled
        }
    })
    .catch((error) => {
        // error...
    });
```

### [bool] isExpired(object] purchaseData)

Returns a boolean `true` if a canceled receipt is validated.

**NOTE** This is subscription only.

```javascript
iap.validate(receipt)
    .then((response) => {
        var purchaseData = iap.getPurchaseData(response);
        if (iap.isExpired(purchaseData[0])) {
            // receipt has been expired
        }
    })
    .catch((error) => {
        // error...
    });
```

### [void] setAmazonValidationHost([string] host)

Allows you to set custom validation host name for tests.

### [void] resetAmazonValidationHost()

Resets to Amazon's validation host name.

## Google Play Public Key With An Environment Variable

You may not want to keep the public key files on your server(s).

The module also supports environment variables for this.

Instead of using `googlePublicKeyPath: 'path/to...'` in your configurations, you the following:

```
export=GOOGLE_IAB_PUBLICKEY_LIVE=PublicKeyHerePlz
export=GOOGLE_IAB_PUBLICKEY_SANDBOX=PublicKeyHerePlz
```

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
 * Add this to `Authorized Redirect URIs`: https://developers.google.com/oauthplayground
 * Hit Save and copy the **clientID** and **clientSecret** somewhere safe.

##### Part 2 - Get Access and Refresh Tokens
1. Go to: https://developers.google.com/oauthplayground
2. On the right, hit the gear/settings.
3. Check the box: `Use your own OAuth credentials`
    * Enter in clientID and clientSecret
    * Close
4. On the left, find "Google Play Developer API v3"
 * Select "https://www.googleapis.com/auth/androidpublisher"
5. Hit Authorize Api's button
6. Save `Authorization Code`
 * This is your: **googleAccToken**
7. Hit `Exchange Authorization code for token`
8. Grab: `Refresh Token`
 * This is your: **googleRefToken**

Now you are able to query for Android subscription status!

## Amazon App Store Reference

https://developer.amazon.com/docs/in-app-purchasing/iap-rvs-for-android-apps.html

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

## HTTP Request Configurations

The module supports the same configurations as [npm request module] (https://www.npmjs.com/package/request#requestoptions-callback)

