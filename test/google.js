var assert = require('assert'); 
var fs = require('fs');
var fixedPath = process.cwd() + '/test/receipts/google';
var fixedPkPath = process.cwd() + '/test/receipts/google_pub/';

describe('#### Google ####', function () {

	/**************************
	* With Public Key From FS *
	***************************/
		
	it('Cannot validate google in-app-purchase with a receipt.data that is not a string', function (done) {
		
		var path = process.argv[process.argv.length - 2].replace('--path=', '');
		var pkPath = process.argv[process.argv.length - 1].replace('--pk=', '');

		if (path === 'false') {
			path = fixedPath;
		}
		if (pkPath === 'false') {
			pkPath = fixedPkPath;
		}

		var iap = require('../');
		iap.config({
			verbose: true,
			googlePublicKeyPath: pkPath
		});
		iap.setup(function (error) {
			assert.equal(error, undefined);
			fs.readFile(path, function (error, data) {
				assert.equal(error, undefined);
				var receipt = JSON.parse(data.toString());
				receipt.data = {};
				iap.validate(iap.GOOGLE, receipt, function (error, response) {
					assert(error);
					//assert.equal(error.message, 'receipt.data must be a string');
					assert.equal(iap.isValidated(response), false);
					done();
				});
			});
		});

	});
		
	it('Can validate Unity google in-app-purchase w/ auto-service detection', function (done) {
	
		var path = process.cwd() + '/test/receipts/unity_google';	
		var pkPath = process.argv[process.argv.length - 1].replace('--pk=', '');

		if (pkPath === 'false') {
			pkPath = fixedPkPath;
		}

		var iap = require('../');
		iap.config({
			verbose: true,
			googlePublicKeyPath: pkPath
		});
		iap.setup(function (error) {
			assert.equal(error, undefined);
			fs.readFile(path, function (error, data) {
				assert.equal(error, undefined);
				var receipt = JSON.parse(data.toString());
				iap.validate(receipt, function (error, response) {
				console.log('>>>>>>>>>>>>>>>>', response);
					assert.equal(error, undefined);
					assert.equal(iap.isValidated(response), true);
					var data = iap.getPurchaseData(response);
					for (var i = 0, len = data.length; i < len; i++) {
						console.log('parsed purchased data', i, data[i]);
						assert(data[i].productId);
						assert(data[i].transactionId);
						assert(data[i].purchaseDate);
						assert(data[i].quantity);
					}
					done();
				});
			});
		});
	
	});
		
	it('Can validate google in-app-purchase w/ auto-service detection', function (done) {
		
		var path = process.argv[process.argv.length - 2].replace('--path=', '');
		var pkPath = process.argv[process.argv.length - 1].replace('--pk=', '');

		if (path === 'false') {
			path = fixedPath;
		}
		if (pkPath === 'false') {
			pkPath = fixedPkPath;
		}

		var iap = require('../');
		iap.config({
			verbose: true,
			googlePublicKeyPath: pkPath
		});
		iap.setup(function (error) {
			assert.equal(error, undefined);
			fs.readFile(path, function (error, data) {
				assert.equal(error, undefined);
				var receipt = JSON.parse(data.toString());
				iap.validate(receipt, function (error, response) {
				console.log('>>>>>>>>>>>>>>>>', response);
					assert.equal(error, undefined);
					assert.equal(iap.isValidated(response), true);
					var data = iap.getPurchaseData(response);
					for (var i = 0, len = data.length; i < len; i++) {
						console.log('parsed purchased data', i, data[i]);
						assert(data[i].productId);
						assert(data[i].transactionId);
						assert(data[i].purchaseDate);
						assert(data[i].quantity);
					}
					done();
				});
			});
		});
	
	});
		
	it('Can validate google in-app-purchase w/ Promise & auto service detection', function (done) {
	
		if (!Promise) {
			return done();
		}
	
		var path = process.argv[process.argv.length - 2].replace('--path=', '');
		var pkPath = process.argv[process.argv.length - 1].replace('--pk=', '');

		if (path === 'false') {
			path = fixedPath;
		}
		if (pkPath === 'false') {
			pkPath = fixedPkPath;
		}

		var iap = require('../');
		iap.config({
			verbose: true,
			googlePublicKeyPath: pkPath
		});
		var receipt = JSON.parse(fs.readFileSync(path, 'utf8'));
		var promise = iap.setup();
		promise.then(function () {
			var val = iap.validate(receipt);
			val.then(function (response) {
				console.log('Validate w/ Promise >>>>>>>>>>>>>>>>', response);
				assert.equal(iap.isValidated(response), true);
				var data = iap.getPurchaseData(response);
				for (var i = 0, len = data.length; i < len; i++) {
					console.log('parsed purchased data', i, data[i]);
					assert(data[i].productId);
					assert(data[i].transactionId);
					assert(data[i].purchaseDate);
					assert(data[i].quantity);
				}
				done();
			}).catch(function (error) {
				throw error;
			});
		}).catch(function (error) {
			throw error;
		});
	
	});
		
	it('Can validate google in-app-purchase', function (done) {
		
		var path = process.argv[process.argv.length - 2].replace('--path=', '');
		var pkPath = process.argv[process.argv.length - 1].replace('--pk=', '');

		if (path === 'false') {
			path = fixedPath;
		}
		if (pkPath === 'false') {
			pkPath = fixedPkPath;
		}

		var iap = require('../');
		iap.config({
			verbose: true,
			googlePublicKeyPath: pkPath
		});
		iap.setup(function (error) {
			assert.equal(error, undefined);
			fs.readFile(path, function (error, data) {
				assert.equal(error, undefined);
				var receipt = JSON.parse(data.toString());
				iap.validate(iap.GOOGLE, receipt, function (error, response) {
				console.log('>>>>>>>>>>>>>>>>', response);
					assert.equal(error, undefined);
					assert.equal(iap.isValidated(response), true);
					var data = iap.getPurchaseData(response);
					for (var i = 0, len = data.length; i < len; i++) {
						console.log('parsed purchased data', i, data[i]);
						assert(data[i].productId);
						assert(data[i].transactionId);
						assert(data[i].purchaseDate);
						assert(data[i].quantity);
					}
					done();
				});
			});
		});
	
	});
		
	it('Can auto-stringify purchase receipt object and validate google in-app-purchase', function (done) {
		
		var path = process.argv[process.argv.length - 2].replace('--path=', '');
		var pkPath = process.argv[process.argv.length - 1].replace('--pk=', '');

		if (path === 'false') {
			path = fixedPath;
		}
		if (pkPath === 'false') {
			pkPath = fixedPkPath;
		}

		var iap = require('../');
		iap.config({
			verbose: true,
			googlePublicKeyPath: pkPath
		});
		iap.setup(function (error) {
			assert.equal(error, undefined);
			fs.readFile(path, function (error, data) {
				assert.equal(error, undefined);
				var receipt = JSON.parse(data.toString());
				// receipt.data = JSON.parse(receipt.data);
				iap.validate(iap.GOOGLE, receipt, function (error, response) {
					assert.equal(error, undefined);
					assert.equal(iap.isValidated(response), true);
					var data = iap.getPurchaseData(response);
					for (var i = 0, len = data.length; i < len; i++) {
						assert(data[i].productId);
						assert(data[i].transactionId);
						assert(data[i].purchaseDate);
						assert(data[i].quantity);
					}
					done();
				});
			});
		});
	
	});
	
	it('Can NOT validate google in-app-purchase with incorrect receipt w/ auto-service detection', function (done) {
		
		var path = process.argv[process.argv.length - 2].replace('--path=', '');
		var pkPath = process.argv[process.argv.length - 1].replace('--pk=', '');

		if (path === 'false') {
			path = fixedPath;
		}
		if (pkPath === 'false') {
			pkPath = fixedPkPath;
		}

		var iap = require('../');
		iap.config({
			verbose: true,
			googlePublicKeyPath: pkPath
		});
		iap.setup(function (error) {
			assert.equal(error, undefined);
			iap.validate({ data: 'fake-receipt', signature: 'fake' }, function (error, response) {
				assert(error);
				assert.equal(iap.isValidated(response), false);
				done();
			});
		});
	
	});
	
	it('Can NOT validate google in-app-purchase with incorrect receipt', function (done) {
		
		var path = process.argv[process.argv.length - 2].replace('--path=', '');
		var pkPath = process.argv[process.argv.length - 1].replace('--pk=', '');

		if (path === 'false') {
			path = fixedPath;
		}
		if (pkPath === 'false') {
			pkPath = fixedPkPath;
		}

		var iap = require('../');
		iap.config({
			verbose: true,
			googlePublicKeyPath: pkPath
		});
		iap.setup(function (error) {
			assert.equal(error, undefined);
			iap.validate(iap.GOOGLE, { data: 'fake-receipt', signature: 'fake' }, function (error, response) {
				assert(error);
				assert.equal(iap.isValidated(response), false);
				done();
			});
		});
	
	});
		
	it('Can validate google in-app-purchase and check subscription state and fail', function (done) {
		
		var path = process.argv[process.argv.length - 2].replace('--path=', '');
		var pkPath = process.argv[process.argv.length - 1].replace('--pk=', '');

		if (path === 'false') {
			path = fixedPath;
		}
		if (pkPath === 'false') {
			pkPath = fixedPkPath;
		}

		var iap = require('../');
		iap.config({
			verbose: true,
			googlePublicKeyPath: pkPath,
			googleAccToken: 111,
			googleRefToken: 222,
			googleClientID: 333,
			googleClientSecret: 444
		});
		iap.setup(function (error) {
			assert.equal(error, undefined);
			fs.readFile(path, function (error, data) {
				assert.equal(error, undefined);
				var receipt = JSON.parse(data.toString());
				iap.validate(iap.GOOGLE, receipt, function (error, response) {
					assert(error);
					if (error.message) {
						assert.equal(error.message, '{"error":"invalid_client","error_description":"The OAuth client was not found."}');
					}
					done();
				});
			});
		});
	
	});

	// /****************************
	// * With Public Key As String *
	// ****************************/
		
	it('Can validate google in-app-purchase with public key as string "googlePublicKeyStrLive"', function (done) {
	
		var exec = require('child_process').exec;	
		var path = process.argv[process.argv.length - 2].replace('--path=', '');
		var pkPath = process.argv[process.argv.length - 1].replace('--pk=', '');

		if (path === 'false') {
			path = fixedPath;
		}
		if (pkPath === 'false') {
			pkPath = fixedPkPath;
		}

		var iap = require('../');
		iap.reset();
		fs.readFile(pkPath + 'iap-live', 'utf-8', function (error, pkeyValue) {
			assert.equal(error, undefined);
			iap.config({
				verbose: true,
				googlePublicKeyPath: null,
				googlePublicKeyStrLive: pkeyValue.replace(/(\r\n|\n|\r)/gm, ''),
				googlePublicKeyStrSandbox: pkeyValue.replace(/(\r\n|\n|\r)/gm, '')
			});
			fs.readFile(pkPath + 'iap-sandbox', 'utf8', function (error, pk) {
				assert.equal(error, undefined);
				// now test
				iap.setup(function (error) {
					assert.equal(error, undefined);
					fs.readFile(path, function (error, data) {
						assert.equal(error, undefined);
						var receipt = data.toString();
						iap.validate(iap.GOOGLE, JSON.parse(receipt), function (error, response) {
							assert.equal(error, undefined);
							assert.equal(iap.isValidated(response), true);
							var data = iap.getPurchaseData(response);
							for (var i = 0, len = data.length; i < len; i++) {
								assert(data[i].transactionId);
								assert(data[i].productId);
								assert(data[i].purchaseDate);
								assert(data[i].quantity);
							}
							exec('unset GOOGLE_IAB_PUBLICKEY_SANDBOX', done);
						});
					});
				});
			});
		});
	
	});
		
	it('Can validate google in-app-purchase with public key as string "googlePublicKeyStrLive"', function (done) {
	
		var exec = require('child_process').exec;	
		var path = process.argv[process.argv.length - 2].replace('--path=', '');
		var pkPath = process.argv[process.argv.length - 1].replace('--pk=', '');

		if (path === 'false') {
			path = fixedPath;
		}
		if (pkPath === 'false') {
			pkPath = fixedPkPath;
		}

		var iap = require('../');
		iap.reset();
		fs.readFile(pkPath + 'iap-live', 'utf-8', function (error, pkeyValue) {
			assert.equal(error, undefined);
			iap.config({
				verbose: true,
				googlePublicKeyPath: null,
				googlePublicKeyStrLive: pkeyValue.replace(/(\r\n|\n|\r)/gm, ''),
				googlePublicKeyStrSandbox: pkeyValue.replace(/(\r\n|\n|\r)/gm, '')
			});
			fs.readFile(pkPath + 'iap-sandbox', 'utf8', function (error, pk) {
				assert.equal(error, undefined);
				// now test
				iap.setup(function (error) {
					assert.equal(error, undefined);
					fs.readFile(path, function (error, data) {
						assert.equal(error, undefined);
						var receipt = data.toString();
						iap.validate(iap.GOOGLE, JSON.parse(receipt), function (error, response) {
							assert.equal(error, undefined);
							assert.equal(iap.isValidated(response), true);
							var data = iap.getPurchaseData(response);
							for (var i = 0, len = data.length; i < len; i++) {
								assert(data[i].transactionId);
								assert(data[i].productId);
								assert(data[i].purchaseDate);
								assert(data[i].quantity);
							}
							exec('unset GOOGLE_IAB_PUBLICKEY_SANDBOX', done);
						});
					});
				});
			});
		});
	
	});

	/***************************
	* With Public Key From ENV *
	***************************/
		
	it('Can validate google in-app-purchase with public key from ENV variable', function (done) {
	
		var exec = require('child_process').exec;	
		var path = process.argv[process.argv.length - 2].replace('--path=', '');
		var pkPath = process.argv[process.argv.length - 1].replace('--pk=', '');

		if (path === 'false') {
			path = fixedPath;
		}
		if (pkPath === 'false') {
			pkPath = fixedPkPath;
		}

		var iap = require('../');
		iap.reset();
		fs.readFile(pkPath + 'iap-live', 'utf8', function (error, pk) {
			assert.equal(error, undefined);
			// set env variable
			process.env.GOOGLE_IAB_PUBLICKEY_LIVE = pk.replace(/(\r\n|\n|\r)/gm, '');
			process.env.GOOGLE_IAB_PUBLICKEY_SANDBOX = pk.replace(/(\r\n|\n|\r)/gm, '');
			// now test
			iap.setup(function (error) {
				assert.equal(error, undefined);
				fs.readFile(path, function (error, data) {
					assert.equal(error, undefined);
					var receipt = data.toString();
					iap.validate(iap.GOOGLE, JSON.parse(receipt), function (error, response) {
						assert.equal(error, undefined);
						assert.equal(iap.isValidated(response), true);
						var data = iap.getPurchaseData(response);
						for (var i = 0, len = data.length; i < len; i++) {
							assert(data[i].transactionId);
							assert(data[i].productId);
							assert(data[i].purchaseDate);
							assert(data[i].quantity);
						}
						exec('unset GOOGLE_IAB_PUBLICKEY_SANDBOX', done);
					});
				});
			});
		});
	
	});
	
	it('Can get an error message', function (done) {
		
		var path = process.argv[process.argv.length - 2].replace('--path=', '');
		var pkPath = process.argv[process.argv.length - 1].replace('--pk=', '');

		if (path === 'false') {
			path = fixedPath;
		}
		if (pkPath === 'false') {
			pkPath = fixedPkPath;
		}

		var iap = require('../');
		iap.config({
			verbose: true,
			googlePublicKeyPath: pkPath
		});
		iap.setup(function (error) {
			assert.equal(error, undefined);
			iap.validate(iap.GOOGLE, { data: 'fake-receipt', signature: 'fake' }, function (error, response) {
				assert(error);
				assert.equal(iap.isValidated(response), false);
				done();
			});
		});
	
	});


	/*******************************
	* Providing subscription info *
	/*******************************/

	it('Access to subscription even info has an invalid access token', function (done) {
		
		var path = process.argv[process.argv.length - 2].replace('--path=', '');
		var pkPath = process.argv[process.argv.length - 1].replace('--pk=', '');
		var api = process.argv[process.argv.length - 3].replace('--api=', '');

		if (path === 'false') {
			path = fixedPath;
		}
		if (pkPath === 'false') {
			pkPath = fixedPkPath;
		}
		
		var iap = require('../');
		iap.reset();
		fs.readFile(api, function(error, data){
			if(error){
				// assuming that no api info was provided
				console.error('Skipped test:', error);
				return done();
			}
			assert.equal(error, undefined);
			var apiInfo = JSON.parse(data.toString());
			apiInfo.googleAccToken += 'a';
			iap.config({
				verbose: true,
				googlePublicKeyPath: pkPath,
				googleAccToken: apiInfo.googleAccToken,
				googleRefToken: apiInfo.googleRefToken,
				googleClientID: apiInfo.googleClientID,
				googleClientSecret: apiInfo.googleClientSecret
			});
			iap.setup(function (error) {
				assert.equal(error, undefined);
				fs.readFile(path, function (error, data) {
					assert.equal(error, undefined);
					var receipt = JSON.parse(data.toString());
					iap.validate(iap.GOOGLE, receipt, function (error, response) {
						assert.equal(error, undefined);
						assert.equal(iap.isValidated(response), true);
						done();
					});
				});
			});
		});

	});

	it('Cannot refresh access due to an invalid refresh token', function (done) {
		
		var path = process.argv[process.argv.length - 2].replace('--path=', '');
		var pkPath = process.argv[process.argv.length - 1].replace('--pk=', '');
		var api = process.argv[process.argv.length - 3].replace('--api=', '');

		if (path === 'false') {
			path = fixedPath;
		}
		if (pkPath === 'false') {
			pkPath = fixedPkPath;
		}
		
		var iap = require('../');
		iap.reset();
		fs.readFile(api, function(error, data){
			if(error){
				// assuming that no api info was provided
				console.error('Skipped test:', error);
				return done();
			}
			assert.equal(error, undefined);
			var apiInfo = JSON.parse(data.toString());
			apiInfo.googleRefToken = 'dummy_token';
			iap.config({
				verbose: true,
				googlePublicKeyPath: pkPath,
				googleAccToken: apiInfo.googleAccToken,
				googleRefToken: apiInfo.googleRefToken,
				googleClientID: apiInfo.googleClientID,
				googleClientSecret: apiInfo.googleClientSecret
			});
			iap.setup(function (error) {
				assert.equal(error, undefined);
				iap.refreshGoogleToken(function(error, response){
					assert(error, true);
					assert(error, 'invalid_grant');
					assert(response.message, 'invalid_grant');
					done();
				});

			});
		});
		
	});

	it('Cannot call refresh access function if did not provide needed information', function (done) {
		
		var path = process.argv[process.argv.length - 2].replace('--path=', '');
		var pkPath = process.argv[process.argv.length - 1].replace('--pk=', '');
		var api = process.argv[process.argv.length - 3].replace('--api=', '');

		if (path === 'false') {
			path = fixedPath;
		}
		if (pkPath === 'false') {
			pkPath = fixedPkPath;
		}
		
		var iap = require('../');
		iap.reset();
		fs.readFile(api, function(error, data){
			if(error){
				// assuming that no api info was provided
				console.error('Skipped test:', error);
				return done();
			}
			assert.equal(error, undefined);
			var apiInfo = JSON.parse(data.toString());
			iap.config({
				verbose: true,
				googlePublicKeyPath: pkPath,
				googleAccToken: apiInfo.googleAccToken,
				googleClientID: apiInfo.googleClientID,
				googleClientSecret: apiInfo.googleClientSecret
			});
			iap.setup(function (error) {
				assert.equal(error, undefined);
				iap.refreshGoogleToken(function(error, response){
					assert(error, true);
					assert(error, 'missing google play api info');
					done();
				});

			});
		});
		
	});

	// /**********************************
	// * With Dynamically Fed Public Key *
	// **********************************/
		
	it('Can validate Unity google in-app-purchase with dynamically fed public key', function (done) {
	
		var exec = require('child_process').exec;	
		var path = process.cwd() + '/test/receipts/unity_google';
		var pkPath = process.argv[process.argv.length - 1].replace('--pk=', '');

		if (path === 'false') {
			path = fixedPath;
		}
		if (pkPath === 'false') {
			pkPath = fixedPkPath;
		}

		var iap = require('../');
		iap.reset();
		fs.readFile(pkPath + 'iap-live', 'utf-8', function (error, pkeyValue) {
			assert.equal(error, undefined);
			iap.config({
				verbose: true,
			});
			var pubkey = pkeyValue.replace(/(\r\n|\n|\r)/gm, '');
			assert.equal(error, undefined);
			// now test
			iap.setup(function (error) {
				assert.equal(error, undefined);
				fs.readFile(path, function (error, data) {
					assert.equal(error, undefined);
					var receipt = data.toString();
					iap.validateOnce(JSON.parse(receipt), pubkey, function (error, response) {
						assert.equal(error, undefined);
						assert.equal(iap.isValidated(response), true);
						var data = iap.getPurchaseData(response);
						for (var i = 0, len = data.length; i < len; i++) {
							assert(data[i].transactionId);
							assert(data[i].productId);
							assert(data[i].purchaseDate);
							assert(data[i].quantity);
						}
						exec('unset GOOGLE_IAB_PUBLICKEY_SANDBOX', done);
					});
				});
			});
		});
	
	});
		
	it('Can validate google in-app-purchase with dynamically fed public key', function (done) {
	
		var exec = require('child_process').exec;	
		var path = process.argv[process.argv.length - 2].replace('--path=', '');
		var pkPath = process.argv[process.argv.length - 1].replace('--pk=', '');

		if (path === 'false') {
			path = fixedPath;
		}
		if (pkPath === 'false') {
			pkPath = fixedPkPath;
		}

		var iap = require('../');
		iap.reset();
		fs.readFile(pkPath + 'iap-live', 'utf-8', function (error, pkeyValue) {
			assert.equal(error, undefined);
			iap.config({
				verbose: true,
			});
			var pubkey = pkeyValue.replace(/(\r\n|\n|\r)/gm, '');
			assert.equal(error, undefined);
			// now test
			iap.setup(function (error) {
				assert.equal(error, undefined);
				fs.readFile(path, function (error, data) {
					assert.equal(error, undefined);
					var receipt = data.toString();
					iap.validateOnce(iap.GOOGLE, pubkey, JSON.parse(receipt), function (error, response) {
						assert.equal(error, undefined);
						assert.equal(iap.isValidated(response), true);
						var data = iap.getPurchaseData(response);
						for (var i = 0, len = data.length; i < len; i++) {
							assert(data[i].transactionId);
							assert(data[i].productId);
							assert(data[i].purchaseDate);
							assert(data[i].quantity);
						}
						exec('unset GOOGLE_IAB_PUBLICKEY_SANDBOX', done);
					});
				});
			});
		});
	
	});
	
});
