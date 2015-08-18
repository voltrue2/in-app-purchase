var assert = require('assert');
var fs = require('fs');

describe('iap', function () {
	
	var sharedKey = process.argv[process.argv.length - 3].replace('--sharedKey=', '');
	var path = process.argv[process.argv.length - 2].replace('--path=', '');
	var uuid = process.argv[process.argv.length -1].replace('--uid=', '');
	var iap = require('../');

	it('Can NOT validate amazon in-app-purchase with incorrect receipt', function (done) {
		var fakeReceipt = 'fake-receipt';
		iap.config({
			userId: uuid,
			purchaseToken: fakeReceipt,			
			sharedKey: sharedKey
		});
		iap.setup(function (error) {
			iap.validate(iap.AMAZON, fakeReceipt, function (error, response) {
				console.log(error, response);
				assert(error);
				assert.equal(iap.isValidated(response), false);
				done();
			});
		});
	});

	it('Can validate amazon in-app-purchase', function (done) {
		fs.readFile(path, function (error, data) {
			assert.equal(error, null);
			iap.config({
				userId: uuid,
				purhcaseToken: data.toString(),
				sharedKey: sharedKey
			});
			iap.setup(function (error) {
				assert.equal(error, null);
				var receipt = data.toString();
				iap.validate(iap.AMAZON, receipt, function (error, response) {
					assert.equal(error, null);
					assert.equal(iap.isValidated(response), true);
					var pdata = iap.getPurchaseData(response);
					for (var i = 0, len = pdata.length; i < len; i++) {
						assert(pdata[i].productId);
						assert(pdata[i].purchaseDate);
						assert(pdata[i].quantity);
					}
					console.log(pdata);
					done();
				});
			});
		});
	});

});
