var assert = require('assert');
var fs = require('fs');

describe('iap', function () {

    it('Can validate amazon in-app-purchase', function (done) {

        var sharedKey = process.argv[process.argv.length - 3].replace('--sharedkey=', '');
        var path = process.argv[process.argv.length - 2].replace('--path=', '');
        var uuid = process.argv[process.argv.length - 1].replace('--uuid=', '');

        var iap = require('../');
        fs.readFile(path, function (error, data) {
            iap.config({
                userId: uuid,
                purchaseToken : data.toString(),
                sharedKey     : sharedKey
            });
            iap.setup(function (error) {
                assert.equal(error, undefined);
                assert.equal(error, undefined);
                var receipt = data.toString();
                iap.validate(iap.AMAZON, receipt, function (error, response) {
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

    it('Can NOT validate amazon in-app-purchase with incorrect receipt', function (done) {

        var sharedKey = process.argv[process.argv.length - 3].replace('--sharedkey=', '');
        var path = process.argv[process.argv.length - 2].replace('--path=', '');
        var uuid = process.argv[process.argv.length - 1].replace('--uuid=', '');

        var iap = require('../');
        iap.config({
            userId: uuid,
            purchaseToken : 'fake-receipt',
            sharedKey     : sharedKey
        });
        iap.setup(function (error) {
            assert.equal(error, undefined);
            iap.validate(iap.AMAZON, 'fake-receipt', function (error, response) {
                assert(error);
                assert.equal(iap.isValidated(response), false);
                done();
            });
        });

    });

});

