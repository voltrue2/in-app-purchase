var assert = require('assert');
var fs = require('fs');
var fixedPath = process.cwd() + '/test/receipts/amazon';
var fixedKeyPath = process.cwd() + '/test/receipts/amazon.secret';

describe('#### Amazon ####', function () {
	
	var sharedKey = process.argv[process.argv.length - 2].replace('--sharedKey=', '');
	var path = process.argv[process.argv.length - 1].replace('--path=', '');
	var iap = require('../');

	if (sharedKey === 'false') {
		sharedKey = fixedKeyPath;
	}
	if (path === 'false') {
		path = fixedPath;
	}

	it('Can NOT validate amazon in-app-purchase with incorrect receipt w/ auto-service detection', function (done) {
		var fakeReceipt = { userId: null, receiptId: 'fake-receipt' };
		iap.config({
			verbose: true,
			secret: sharedKey
		});
		iap.setup(function (error) {
			iap.validate(fakeReceipt, function (error, response) {
				assert(error);
				assert.equal(iap.isValidated(response), false);
				done();
			});
		});
	});

	it('Can NOT validate amazon in-app-purchase with incorrect receipt', function (done) {
		var fakeReceipt = { userId: null, receiptId: 'fake-receipt' };
		iap.config({
			verbose: true,
			secret: sharedKey
		});
		iap.setup(function (error) {
			iap.validate(iap.AMAZON, fakeReceipt, function (error, response) {
				assert(error);
				assert.equal(iap.isValidated(response), false);
				done();
			});
		});
	});

	it('Can validate amazon in-app-purchase w/ Promise & auto-service detection', function (done) {
		
		if (!Promise) {
			return done();
		}

		fs.readFile(path, 'UTF-8', function (error, data) {
			assert.equal(error, null);
			iap.config({
				verbose: true,
				secret: sharedKey
			});
			var promise = iap.setup();
			promise.then(function () {
				var receipt = JSON.parse(data.toString());
				var val = iap.validate(receipt);
				val.then(function (response) {
					assert.equal(iap.isValidated(response), true);
					var pdata = iap.getPurchaseData(response);
					for (var i = 0, len = pdata.length; i < len; i++) {
						assert(pdata[i].productId);
						assert(pdata[i].purchaseDate);
						assert(pdata[i].quantity);
					}
					done();
				}).catch(function (error) {
					throw error;
				});
			}).catch(function (error) {
				throw error;
			});
		});
	});

	it('Can validate amazon in-app-purchase w/ auto-service detection', function (done) {
		fs.readFile(path, 'UTF-8', function (error, data) {
			assert.equal(error, null);
			iap.config({
				verbose: true,
				secret: sharedKey
			});
			iap.setup(function (error) {
				assert.equal(error, null);
				var receipt = JSON.parse(data.toString());
				iap.validate(receipt, function (error, response) {
					assert.equal(error, null);
					assert.equal(iap.isValidated(response), true);
					var pdata = iap.getPurchaseData(response);
					for (var i = 0, len = pdata.length; i < len; i++) {
						assert(pdata[i].productId);
						assert(pdata[i].purchaseDate);
						assert(pdata[i].quantity);
					}
					done();
				});
			});
		});
	});

	it('Can validate amazon in-app-purchase', function (done) {
		fs.readFile(path, 'UTF-8', function (error, data) {
			assert.equal(error, null);
			iap.config({
				verbose: true,
				secret: sharedKey
			});
			iap.setup(function (error) {
				assert.equal(error, null);
				var receipt = JSON.parse(data.toString());
				iap.validate(iap.AMAZON, receipt, function (error, response) {
					assert.equal(error, null);
					assert.equal(iap.isValidated(response), true);
					var pdata = iap.getPurchaseData(response);
					for (var i = 0, len = pdata.length; i < len; i++) {
						assert(pdata[i].productId);
						assert(pdata[i].purchaseDate);
						assert(pdata[i].quantity);
					}
					done();
				});
			});
		});
	});

	it('Can get an error response', function (done) {
		var fakeReceipt = { userId: null, receiptId: 'fake-receipt' };
		iap.config({
			verbose: true,
			secret: sharedKey
		});
		iap.setup(function (error) {
			iap.validate(iap.AMAZON, fakeReceipt, function (error, response) {
				assert(error);
				assert(response);
				assert(response.status);
				assert(response.message);
				assert.equal(iap.isValidated(response), false);
				done();
			});
		});
	});

	it('Can validate amazon in-app-purchase with dynamically fed secret', function (done) {
		fs.readFile(path, 'UTF-8', function (error, data) {
			assert.equal(error, null);
			iap.config({
				verbose: true,
				secret: null
			});
			iap.setup(function (error) {
				assert.equal(error, null);
				var receipt = JSON.parse(data.toString());
				fs.readFile(sharedKey, 'UTF-8', function (error, secret) {
					assert.equal(error, null);
					secret = secret.replace(/(\r|\n)/g, '');
					iap.validateOnce(iap.AMAZON, secret, receipt, function (error, response) {
						assert.equal(error, null);
						assert.equal(iap.isValidated(response), true);
						var pdata = iap.getPurchaseData(response);
						for (var i = 0, len = pdata.length; i < len; i++) {
							assert(pdata[i].productId);
							assert(pdata[i].purchaseDate);
							assert(pdata[i].quantity);
						}
						done();
					});
				});
			});
		});
	});

});
