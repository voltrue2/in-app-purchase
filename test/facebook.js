var assert = require('assert');
var fs = require('fs');
var fixedPath = process.cwd() + '/test/receipts/facebook';
var fixedAppAccessTokenPath = process.cwd() + '/test/receipts/facebook.app_token';

describe('#### Facebook ####', function () {

    var appAccessTokenPath = process.argv[process.argv.length - 2].replace('--appAccessToken=', '');
    var receiptPath = process.argv[process.argv.length - 1].replace('--path=', '');

    if (appAccessTokenPath === 'false') {
        appAccessTokenPath = fixedAppAccessTokenPath;
    }
    if (receiptPath === 'false') {
        receiptPath = fixedPath;
    }

    var receipt = null;
    var appId = null;
    var appSecret = null;
    before(function (done) {
        fs.readFile(receiptPath, 'UTF-8', function (error, data) {
            assert.equal(error, null);
            receipt = data.toString();
            fs.readFile(appAccessTokenPath, 'UTF-8', function (error, data) {
                assert.equal(error, null);
                var splitedToken = data.toString().split('|');
                appId = splitedToken[0];
                appSecret = splitedToken[1];
                done();
            });
        });
    });

    it('Can NOT validate facebook in-app-purchase with incorrect receipt w/ auto-service detection', function (done) {
        var iap = require('../');
        var fakeReceipt = 'MDAwMDA.e30K';
        iap.config({
            verbose: true,
            facebookAppSecret: appSecret,
            facebookAppId: appId
        });
        iap.setup(function (error) {
            assert.equal(error, null);
            iap.validate(fakeReceipt, function (error, response) {
                assert(error);
                assert.equal(iap.isValidated(response), false);
                done();
            });
        });
    });

    it('Can NOT validate facebook in-app-purchase with incorrect receipt', function (done) {
        var iap = require('../');
        var fakeReceipt = 'MDAwMDA.e30K';
        iap.config({
            verbose: true,
            facebookAppSecret: appSecret,
            facebookAppId: appId
        });
        iap.setup(function (error) {
            assert.equal(error, null);
            iap.validate(iap.FACEBOOK, fakeReceipt, function (error, response) {
                assert(error);
                assert.equal(iap.isValidated(response), false);
                done();
            });
        });
    });

    it('Can validate facebook in-app-purchase w/ Promise & auto-service detection', function (done) {

        if (!Promise) {
            return done();
        }

        var iap = require('../');
        iap.config({
            verbose: true,
            facebookAppSecret: appSecret,
            facebookAppId: appId
        });
        var promise = iap.setup();
        promise.then(function () {
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
                done(error);
            });
        }).catch(function (error) {
            done(error);
        });
    });

    it('Can validate facebook in-app-purchase w/ auto-service detection', function (done) {
        var iap = require('../');
        iap.config({
            verbose: true,
            facebookAppSecret: appSecret,
            facebookAppId: appId
        });
        iap.setup(function (error) {
            assert.equal(error, null);
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

    it('Can validate facebook in-app-purchase', function (done) {
        var iap = require('../');
        iap.config({
            verbose: true,
            facebookAppSecret: appSecret,
            facebookAppId: appId
        });
        iap.setup(function (error) {
            assert.equal(error, null);
            iap.validate(iap.FACEBOOK, receipt, function (error, response) {
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

    it('Can get an error response', function (done) {
        var iap = require('../');
        var fakeReceipt = "MDAwMDA.e30K";
        iap.config({
            verbose: true,
            facebookAppSecret: appSecret,
            facebookAppId: appId
        });
        iap.setup(function (error) {
            assert.equal(error, null);
            iap.validate(iap.FACEBOOK, fakeReceipt, function (error, response) {
                assert(error);
                assert(response);
                assert(response.status);
                assert(response.message);
                assert.equal(iap.isValidated(response), false);
                done();
            });
        });
    });

    it('Can validate facebook in-app-purchase using .validateOnce()', function (done) {
        var iap = require('../');
        iap.config({
            verbose: true,
            facebookAppSecret: '',
            facebookAppId: ''
        });
        iap.setup(function (error) {
            assert.equal(error, null);
            iap.validateOnce(iap.FACEBOOK, appId + '|' + appSecret, receipt, function (error, response) {
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

    it('Can validate facebook in-app-purchase using .validateOnce() w/ auto-service detection', function (done) {
        var iap = require('../');
        iap.config({
            verbose: true,
            facebookAppSecret: '',
            facebookAppId: ''
        });
        iap.setup(function (error) {
            assert.equal(error, null);
            iap.validateOnce(receipt, appId + '|' + appSecret, function (error, response) {
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
