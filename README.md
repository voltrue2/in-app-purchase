# in-app-purchase

©Nobuyori Takahashi < <voltrue2@yahoo.com> >

A Node.js module for In-App-Purchase validation for iOS, Android, Amazon, and Windows.

### Methods

#### .validate(service [constant], receipt [string or object], callback [function])

Validates an in-app-purchase receipt.

**NOTE 1:**

constant for iOS: `iap.APPLE`

constant for Android: `iap.GOOGLE`

constant for Windows: `iap.WINDOWS`

constant for Amazon: `iap.AMAZON`

- For Apple validation, receipt is a string.

- For Google validation, receipt is an object `{ data: "xxx", signature: "yyyy" }`.

- For Windows validation, receipt is a signed XML string.

- For Amazon validation, receipt is an object `{ userId: "xxx", receiptId: "yyyy" }`. `receiptId` is a ``purchaseToken sent from Amazon app store server.

**NOTE 2:**

Validation error will have a response object as `{ status: <status code>, message: <message string> }`.

#### .isValidated(response [object])

Returns a boolean.

#### .getPurchaseData(response [object], options [*object]);

Returns a parsed purchase data as an array.

For apple and windows, the returned array may contain more than 1 purchase data.

For windows purchase data and Apple iTunes (recurring subscription only), each purchase data in the array contains `expirationDate`.

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
	transactionId: <string>,
	productId: <string>,
	purchaseDate: <number>,
	quantity: <number>,
	*expirationDate: <number> // iTunes and windows and amazon subscription only
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
			var purcahseDataList = iap.getPurchaseData(response);
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

**NOTE:** This function is for only `windows` and `apple` iTunes (recurring subscription only)

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
			// now check if any of the items validated has been exipred or not
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
				ignoreExipred: true
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
	applePassword: "1234567890abcdef1234567890abcdef", // this comes from iTunes Connect
	googlePublicKeyPath: "path/to/public/key/directory/" // this is the path to the directory containing iap-sanbox/iap-live files
});
```

#### HTTP Request Configuration

The module utilises the Request module for the HTTP requests required to validate Apple and Windows IAP subscriptions. The default settings for requests can be configured by passing in the `requestDefaults` configuration property. This allows you to configure proxies, tunnels and request timeouts. This object can contain any [Request module options](https://github.com/request/request#requestoptions-callback) but may be overridden by request-specific options set by this module.

### GooglePlay Public Key From Environment Variables

For GooglePlay, `in-app-purchase` module can read public key value from the environment variables instead of file(s).

The basics is the same as using file(s).

You will need to set the public key value, which is the same value as you would save as a file, to environment variables.

#### GOOGLE_IAB_PUBLICKEY_SANDBOX

This would be the public key value for sandbox.

`export=GOOGLE_IAB_PUBLICKEY_SANDBOX=xxxxxxxxxxxxxxxxxxxxxxxx`.

#### GOOGLE_IAB_PUBLICKEY_LIVE

This would be the public key value for live

`export=GOOGLE_IAB_PUBLICKEY_LIVE=yyyyyyyyyyyyyyyyyyyyyyyyyy`.

**NOTE**: This works exactly the same as you were to use file(s) with one expection. You do **NOT** need to call `.config()` for GooglePlay since it will be using environment variables instead.

### GooglPlay Public Key As String

The module also allows you to feed GooglePlay public key value as string. For example, you may store the key value in a database and read from it to use it etc.

Example:

```
var iap = require('in-app-purchase');
iap.config({
	googlePublicKeyStrSandBox: publicKeySandboxString,
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

## Google In-app-Billing Set Up

To set up your server-side Android in-app-billing correctly, you must provide the public key string as a file from your Developer Console account.

**Reference:** <a href="https://developer.android.com/google/play/billing/billing_integrate.html#billing-security">Implementing In-app Billing</a>

Once you copy the public key string from the Developer Console account for your application, you simply need to copy and paste it to a file and name it `iap-live` as shown in the example above.

**NOTE:** The public key string you copy from the Developer Console account is actually a base64 string. You do NOT have to convert this to anything yourself. The module converts it to the public key automatically for you.

## Amazon App Store Reference

https://developer.amazon.com/appsandservices/apis/earn/in-app-purchasing/docs/rvs

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
