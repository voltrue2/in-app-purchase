# in-app-purchase

©Nobuyori Takahashi < <voltrue2@yahoo.com> >

A Node.js module for In-App-Purchase validation for iOS, Android, and Windows.

### Methods

#### .validate(receipt [string or object], callback [function])

Validates an in-app-purchase receipt.

- For Apple validation, receipt is a string.

- For Google validation, receipt is an object { data: xxx, signature: yyyy }

- For Windows validate, receipt is a signed XML string.

#### .isValidated(response [object])

Returns a boolean.

#### .getPurchaseData(response [object]);

Returns a parsed purchase data as an array.

For apple and windows, the returned array may contain more than 1 purchase data.

For windows purchase data, each purchase data in the array contains `expirationDate`.

The purchase data structure is:

```
{
	productId: <string>,
	purchaseDate: <number>,
	quantity: <number>,
	*expirationDate: <number> // windows only
}
```

Example:

```javascript
iap.setup(function (error) {
	if (error) {
		// error hmm
	}
	iap.validate(iap.APPLE, function (error, response) {
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

### GooglePlay Public Key From Environment Variables

For GooglePlay, `in-app-purchase` module can read public key value from the environement variables instead of file(s).

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
