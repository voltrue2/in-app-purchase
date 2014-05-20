var assert = require('assert'); 
var fs = require('fs');

describe('iap', function () {
	
	it('Can validate apple in-app-purchase', function (done) {
		
		var path = process.argv[process.argv.length - 1].replace('--path=', '');

		var iap = require('../');
		iap.config({
			sandbox: true
		});
		iap.setup(function (error) {
			assert.equal(error, undefined);
			fs.readFile(path, function (error, data) {
				assert.equal(error, undefined);
				var receipt = data.toString();
				iap.validate(iap.APPLE, receipt, function (error, response) {
					assert.equal(error, undefined);
					assert.equal(iap.isValidated(response), true);
					console.log(response);
					done();
				});
			});
		});
	
	});
	
	it('Can NOT validate apple in-app-purchase with incorrect receipt', function (done) {
		
		var path = process.argv[process.argv.length - 1].replace('--path=', '');

		var iap = require('../');
		iap.config({
			sandbox: true
		});
		iap.setup(function (error) {
			assert.equal(error, undefined);
			iap.validate(iap.APPLE, 'fake-receipt', function (error, response) {
				assert(error);
				assert.equal(iap.isValidated(response), false);
				console.log(response);
				done();
			});
		});
	
	});

});
