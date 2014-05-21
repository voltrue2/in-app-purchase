# in-app-purchase

©Nobuyori Takahashi < <voltrue2@yahoo.com> >

A Node.js module for In-App-Purchase validation for iOS and Android.

### Methods

####.validate(receipt [string or object], callback [function])

Validates an in-app-purchase receipt.

For Apple validation, receipt is a string.

For Google validation, receipt is an object { data: xxx, signature: yyyy }

####.isValid(response [object])

Returns a boolean.

### GooglePlay Public Key Files

For GooglePlay, in-app-purchase module needs to have the public key file(s).

The module requires the file(s) to be name in a certain way:

For sandbox, the file name should be: `iap-sandbox`.

For production, the file name should be: `iap-live`.

The module will automatically decide which file to use based on the configurations given.

### Configurations

The module needs to call `.config()` before it can execute `.setup()` correctly.

Example:

```
var inAppPurchase = require('in-app-purchase');
inAppPurchase.config({
	sandbox: true, // this tells the module which environment it should be connecting to for validation
	googlePublicKeyPath: "path/to/public/key/directory/" // this is the path to the directory containing iap-sanbox/iap-live files
});
```

### How To Use It

Example: Apple

```javascript
var iap = require('in-app-purchase');
/*
For google iap, you need to name your public key file as:
iap-sandbox or iap-live
*/
iap.config({
	sandbox: true,
	googlePublicKeyPath: "/path/to/google/public/key/dir/"
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
		if (iap.isValid(appRes)) {
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
	sandbox: true,
	googlePublicKeyPath: "/path/to/google/public/key/dir/"
});
iap.setup(function (error) {
	if (error) {
		return console.error('something went wrong...');
	}
	// iap is ready
	iap.validate(iap.GOOGLE, appleReceipt, function (err, appleRes) {
		if (err) {
			return console.error(err);
		}
		if (iap.isValid(appRes)) {
			// yay good!
		}
	});
});
```
