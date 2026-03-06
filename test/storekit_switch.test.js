var assert = require('assert');
var iap = require('../');
var constants = require('../constants');
var appleStoreKit2 = require('../lib/appleStoreKit2');

describe('#### StoreKit Switch Logic ####', function () {

    beforeEach(function () {
        iap.reset();
    });

    it('Upgrades Unity Apple receipt to StoreKit 2 when configured and TransactionID is present', function (done) {
        // Configure StoreKit 2
        iap.config({
            appleStoreKit2: {
                issuerId: 'test-issuer-id',
                keyId: 'test-key-id',
                privateKey: '-----BEGIN EC PRIVATE KEY-----\ntest-key\n-----END EC PRIVATE KEY-----',
                bundleId: 'com.test.app'
            }
        });

        iap.setup(function (error) {
            assert.ifError(error);

            // Mock appleStoreKit2.isConfigured to return true (it should already because of config)
            assert.equal(appleStoreKit2.isConfigured(), true);

            var unityReceipt = {
                Store: 'AppleAppStore',
                TransactionID: '2000001110285660',
                Payload: 'legacy-payload',
                Subscription: false
            };

            // We expect appleStoreKit2.validatePurchase to be called.
            // Since we don't have a real Apple Server, we can mock it or just check if it attempts to call it.
            // Here we just want to ensure it reaches the right case.

            var originalValidatePurchase = appleStoreKit2.validatePurchase;
            appleStoreKit2.validatePurchase = function (transactionId, cb) {
                assert.equal(transactionId, '2000001110285660');
                // Restore original
                appleStoreKit2.validatePurchase = originalValidatePurchase;
                done();
            };

            iap.validate(unityReceipt, function () { });
        });
    });

    it('Does NOT upgrade to StoreKit 2 if appleStoreKit2 is NOT configured', function (done) {
        // No StoreKit 2 config

        var unityReceipt = {
            Store: 'AppleAppStore',
            TransactionID: '2000001110285660',
            Payload: 'legacy-payload',
            Subscription: false
        };

        var apple = require('../lib/apple');
        var originalValidatePurchase = apple.validatePurchase;
        apple.validatePurchase = function (secret, receipt, cb) {
            assert.equal(receipt, 'legacy-payload');
            // Restore original
            apple.validatePurchase = originalValidatePurchase;
            done();
        };

        iap.validate(unityReceipt, function () { });
    });

    it('Does NOT upgrade to StoreKit 2 if TransactionID is missing', function (done) {
        // Configure StoreKit 2
        iap.config({
            appleStoreKit2: {
                issuerId: 'test-issuer-id',
                keyId: 'test-key-id',
                privateKey: '-----BEGIN EC PRIVATE KEY-----test-----END EC PRIVATE KEY-----',
                bundleId: 'com.test.app'
            }
        });

        var unityReceipt = {
            Store: 'AppleAppStore',
            // Missing TransactionID
            Payload: 'legacy-payload',
            Subscription: false
        };

        var apple = require('../lib/apple');
        var originalValidatePurchase = apple.validatePurchase;
        apple.validatePurchase = function (secret, receipt, cb) {
            assert.equal(receipt, 'legacy-payload');
            // Restore original
            apple.validatePurchase = originalValidatePurchase;
            done();
        };

        iap.validate(unityReceipt, function () { });
    });

    it('Upgrades Unity Apple receipt to StoreKit 2 in validateOnce', function (done) {
        // Configure StoreKit 2
        iap.config({
            appleStoreKit2: {
                issuerId: 'test-issuer-id',
                keyId: 'test-key-id',
                privateKey: '-----BEGIN EC PRIVATE KEY-----\ntest-key\n-----END EC PRIVATE KEY-----',
                bundleId: 'com.test.app'
            }
        });

        iap.setup(function (error) {
            assert.ifError(error);

            var unityReceipt = {
                Store: 'AppleAppStore',
                TransactionID: '3000001110285660',
                Payload: 'legacy-payload',
                Subscription: false
            };

            var originalValidatePurchase = appleStoreKit2.validatePurchase;
            appleStoreKit2.validatePurchase = function (transactionId, cb) {
                assert.equal(transactionId, '3000001110285660');
                // Restore original
                appleStoreKit2.validatePurchase = originalValidatePurchase;
                done();
            };

            iap.validateOnce(unityReceipt, 'fake-secret', function () { });
        });
    });

});
