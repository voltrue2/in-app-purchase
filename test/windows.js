var assert = require('assert'); 
var fs = require('fs');
var fixedPath = process.cwd() + '/test/receipts/windows';

describe('#### Windows ####', function () {
	
	it('Can validate windows in-app-purchase w/o waiting for .setup()', function (done) {
		
		var path = process.argv[process.argv.length - 1].replace('--path=', '');

		if (path === 'false') {
			path = fixedPath;
		}

		var iap = require('../');
		iap.config({ verbose: true });
		iap.setup();
		fs.readFile(path, function (error, data) {
			assert.equal(error, undefined);
			var receipt = data.toString();
			iap.validate(iap.WINDOWS, receipt, function (error, response) {
				assert.equal(error, undefined);
				assert.equal(iap.isValidated(response), true);
				var data = iap.getPurchaseData(response);
				for (var i = 0, len = data.length; i < len; i++) {
					assert(data[i].productId);
					assert(data[i].purchaseDate);
					assert(data[i].expirationDate);
					assert(data[i].quantity);
				}
				done();
			});
		});
	
	});
	
	it('Can validate windows in-app-purchase w/ Promise & auto-service detection', function (done) {
		
		if (!Promise) {
			return done();
		}
	
		var path = process.argv[process.argv.length - 1].replace('--path=', '');

		if (path === 'false') {
			path = fixedPath;
		}
		
		var iap = require('../');
		var receipt = fs.readFileSync(path, 'utf8');
		var promise = iap.setup();
		promise.then(function () {
			var val = iap.validate(receipt);
			val.then(function (response) {
				assert.equal(iap.isValidated(response), true);
				var data = iap.getPurchaseData(response);
				for (var i = 0, len = data.length; i < len; i++) {
					assert(data[i].productId);
					assert(data[i].purchaseDate);
					assert(data[i].expirationDate);
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
	
	it('Can validate windows in-app-purchase w/ auto-service detection', function (done) {
		
		var path = process.argv[process.argv.length - 1].replace('--path=', '');

		if (path === 'false') {
			path = fixedPath;
		}

		var iap = require('../');
		iap.config({ verbose: true });
		iap.setup(function (error) {
			assert.equal(error, undefined);
			fs.readFile(path, function (error, data) {
				assert.equal(error, undefined);
				var receipt = data.toString();
				iap.validate(receipt, function (error, response) {
					assert.equal(error, undefined);
					assert.equal(iap.isValidated(response), true);
					var data = iap.getPurchaseData(response);
					for (var i = 0, len = data.length; i < len; i++) {
						assert(data[i].productId);
						assert(data[i].purchaseDate);
						assert(data[i].expirationDate);
						assert(data[i].quantity);
					}
					done();
				});
			});
		});
	
	});
	
	it('Can validate windows in-app-purchase', function (done) {
		
		var path = process.argv[process.argv.length - 1].replace('--path=', '');

		if (path === 'false') {
			path = fixedPath;
		}

		var iap = require('../');
		iap.config({ verbose: true });
		iap.setup(function (error) {
			assert.equal(error, undefined);
			fs.readFile(path, function (error, data) {
				assert.equal(error, undefined);
				var receipt = data.toString();
				iap.validate(iap.WINDOWS, receipt, function (error, response) {
					assert.equal(error, undefined);
					assert.equal(iap.isValidated(response), true);
					var data = iap.getPurchaseData(response);
					for (var i = 0, len = data.length; i < len; i++) {
						assert(data[i].productId);
						assert(data[i].purchaseDate);
						assert(data[i].expirationDate);
						assert(data[i].quantity);
					}
					done();
				});
			});
		});
	
	});
	
	it('Can validate windows in-app-purchase using .validateOnce() w/ auto-service detection', function (done) {
		
		var path = process.argv[process.argv.length - 1].replace('--path=', '');

		if (path === 'false') {
			path = fixedPath;
		}

		var iap = require('../');
		iap.config({ verbose: true });
		iap.setup(function (error) {
			assert.equal(error, undefined);
			fs.readFile(path, function (error, data) {
				assert.equal(error, undefined);
				var receipt = data.toString();
				iap.validateOnce(receipt, null, function (error, response) {
					assert.equal(error, undefined);
					assert.equal(iap.isValidated(response), true);
					var data = iap.getPurchaseData(response);
					for (var i = 0, len = data.length; i < len; i++) {
						assert(data[i].productId);
						assert(data[i].purchaseDate);
						assert(data[i].expirationDate);
						assert(data[i].quantity);
					}
					done();
				});
			});
		});
	
	});
	
	it('Can validate windows in-app-purchase using .validateOnce()', function (done) {
		
		var path = process.argv[process.argv.length - 1].replace('--path=', '');

		if (path === 'false') {
			path = fixedPath;
		}

		var iap = require('../');
		iap.config({ verbose: true });
		iap.setup(function (error) {
			assert.equal(error, undefined);
			fs.readFile(path, function (error, data) {
				assert.equal(error, undefined);
				var receipt = data.toString();
				iap.validateOnce(iap.WINDOWS, null, receipt, function (error, response) {
					assert.equal(error, undefined);
					assert.equal(iap.isValidated(response), true);
					var data = iap.getPurchaseData(response);
					for (var i = 0, len = data.length; i < len; i++) {
						assert(data[i].productId);
						assert(data[i].purchaseDate);
						assert(data[i].expirationDate);
						assert(data[i].quantity);
					}
					done();
				});
			});
		});
	
	});
	
	it('Can validate windows in-app-purchase and ignores expired item', function (done) {
		
		var path = process.argv[process.argv.length - 1].replace('--path=', '');

		if (path === 'false') {
			path = fixedPath;
		}

		var iap = require('../');
		iap.config({ verbose: true });
		iap.setup(function (error) {
			assert.equal(error, undefined);
			fs.readFile(path, function (error, data) {
				assert.equal(error, undefined);
				var receipt = data.toString();
				iap.validate(iap.WINDOWS, receipt, function (error, response) {
					assert.equal(error, undefined);
					assert.equal(iap.isValidated(response), true);
					var data = iap.getPurchaseData(response, { ignoreExpired: true });
					assert.equal(data.length, 0);
					done();
				});
			});
		});
	
	});
	
	it('Can NOT validate windows in-app-purchase with incorrect receipt w/ auto-service detection', function (done) {
		
		var path = process.argv[process.argv.length - 1].replace('--path=', '');

		if (path === 'false') {
			path = fixedPath;
		}

		var iap = require('../');
		iap.config({ verbose: true });
		iap.setup(function (error) {
			assert.equal(error, undefined);
			iap.validate(iap.WINDOWS, 'fake-receipt', function (error, response) {
				assert(error);
				assert.equal(iap.isValidated(response), false);
				done();
			});
		});
	
	});
	
	it('Can NOT validate windows in-app-purchase with incorrect receipt', function (done) {
		
		var path = process.argv[process.argv.length - 1].replace('--path=', '');

		if (path === 'false') {
			path = fixedPath;
		}

		var iap = require('../');
		iap.config({ verbose: true });
		iap.setup(function (error) {
			assert.equal(error, undefined);
			iap.validate(iap.WINDOWS, 'fake-receipt', function (error, response) {
				assert(error);
				assert.equal(iap.isValidated(response), false);
				done();
			});
		});
	
	});
	
	it('Can get an error response', function (done) {
		
		var path = process.argv[process.argv.length - 1].replace('--path=', '');

		if (path === 'false') {
			path = fixedPath;
		}

		var iap = require('../');
		iap.config({ verbose: true });
		iap.setup(function (error) {
			assert.equal(error, undefined);
			iap.validate(iap.WINDOWS, 'fake-receipt', function (error, response) {
				assert(error);
				assert(response.status);
                                assert(response.message);
				assert.equal(iap.isValidated(response), false);
				done();
			});
		});
	
	});

});
