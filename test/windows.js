var assert = require('assert'); 
var fs = require('fs');

describe('iap', function () {
	
	it('Can validate windows in-app-purchase', function (done) {
		
		var path = process.argv[process.argv.length - 1].replace('--path=', '');

		var iap = require('../');
		iap.setup(function (error) {
			assert.equal(error, undefined);
			fs.readFile(path, function (error, data) {
				assert.equal(error, undefined);
				var receipt = data.toString();
				iap.validate(iap.WINDOWS, receipt, function (error, response) {
					assert.equal(error, undefined);
					assert.equal(iap.isValidated(response), true);
					console.log(response);
					done();
				});
			});
		});
	
	});
	
	it('Can NOT validate windows in-app-purchase with incorrect receipt', function (done) {
		
		var path = process.argv[process.argv.length - 1].replace('--path=', '');

		var iap = require('../');
		iap.setup(function (error) {
			assert.equal(error, undefined);
			iap.validate(iap.WINDOWS, 'fake-receipt', function (error, response) {
				assert(error);
				assert.equal(iap.isValidated(response), false);
				console.log(response);
				done();
			});
		});
	
	});

});
