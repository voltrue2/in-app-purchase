var assert = require('assert'); 
var fs = require('fs');

describe('iap', function () {

	/**************************
	* With Public Key From FS *
	***************************/
		
	it('Can validate google in-app-purchase', function (done) {
		
		var path = process.argv[process.argv.length - 2].replace('--path=', '');
		var pkPath = process.argv[process.argv.length - 1].replace('--pk=', '');

		var iap = require('../');
		iap.config({
			googlePublicKeyPath: pkPath
		});
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
						assert(data[i].productId);
						assert(data[i].purchaseDate);
						assert(data[i].quantity);
					}
					console.log(data);
					done();
				});
			});
		});
	
	});
	
	it('Can NOT validate google in-app-purchase with incorrect receipt', function (done) {
		
		var path = process.argv[process.argv.length - 2].replace('--path=', '');
		var pkPath = process.argv[process.argv.length - 1].replace('--pk=', '');

		var iap = require('../');
		iap.config({
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

	/****************************
	* With Public Key As String *
	****************************/
		
	it('Can validate google in-app-purchase with public key as string "publicKeyStrLive"', function (done) {
	
		var exec = require('child_process').exec;	
		var path = process.argv[process.argv.length - 2].replace('--path=', '');
		var pkPath = process.argv[process.argv.length - 1].replace('--pk=', '');

		var iap = require('../');
		iap.reset();
		fs.readFile(pkPath + 'iap-live', 'utf-8', function (error, pkeyValue) {
			assert.equal(error, undefined);
			iap.config({
				googlePublicKeyPath: null,
				publicKeyStrLive: pkeyValue.replace(/(\r\n|\n|\r)/gm, ''),
				publicKeyStrSandbox: pkeyValue.replace(/(\r\n|\n|\r)/gm, '')
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
								assert(data[i].productId);
								assert(data[i].purchaseDate);
								assert(data[i].quantity);
							}
							console.log(data);
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

		var iap = require('../');
		iap.reset();
		fs.readFile(pkPath + 'iap-live', 'utf-8', function (error, pkeyValue) {
			assert.equal(error, undefined);
			iap.config({
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
								assert(data[i].productId);
								assert(data[i].purchaseDate);
								assert(data[i].quantity);
							}
							console.log(data);
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
							assert(data[i].productId);
							assert(data[i].purchaseDate);
							assert(data[i].quantity);
						}
						console.log(data);
						exec('unset GOOGLE_IAB_PUBLICKEY_SANDBOX', done);
					});
				});
			});
		});
	
	});

});
