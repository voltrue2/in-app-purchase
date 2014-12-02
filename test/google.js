var assert = require('assert'); 
var fs = require('fs');

describe('iap', function () {
	
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
		
		var path = process.argv[process.argv.length - 1].replace('--path=', '');

		var iap = require('../');
		iap.config({
			sandbox: true
		});
		iap.setup(function (error) {
			assert.equal(error, undefined);
			iap.validate(iap.APPLE, { data: 'fake-receipt', signature: 'fake' }, function (error, response) {
				assert(error);
				assert.equal(iap.isValidated(response), false);
				done();
			});
		});
	
	});

});
