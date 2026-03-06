var assert = require('assert');

describe('#### Apple StoreKit 2 ####', function () {

    beforeEach(function () {
        // Reset module state before each test
        var iap = require('../');
        iap.reset();
    });

    it('Exports APPLE_STOREKIT2 constant', function () {
        var iap = require('../');
        assert.equal(iap.APPLE_STOREKIT2, 'apple_storekit2');
    });

    it('Can configure with StoreKit 2 settings', function (done) {
        var iap = require('../');
        iap.config({
            appleStoreKit2: {
                issuerId: 'test-issuer-id',
                keyId: 'test-key-id',
                privateKey: '-----BEGIN EC PRIVATE KEY-----\ntest-key\n-----END EC PRIVATE KEY-----',
                bundleId: 'com.test.app',
                environment: 'Sandbox'
            }
        });
        // Config should not throw
        done();
    });

    it('Can parse StoreKit 2 transaction info with getPurchaseData()', function () {
        var iap = require('../');
        var mockResponse = {
            service: iap.APPLE_STOREKIT2,
            status: 0,
            transactionInfo: {
                bundleId: 'com.test.app',
                transactionId: '1000000123456789',
                originalTransactionId: '1000000123456789',
                productId: 'premium_subscription',
                quantity: 1,
                purchaseDate: 1609459200000,
                originalPurchaseDate: 1609459200000,
                expiresDate: 1612137600000,
                type: 'Auto-Renewable Subscription',
                environment: 'Sandbox'
            }
        };

        var parsed = iap.getPurchaseData(mockResponse);
        assert(Array.isArray(parsed));
        assert.equal(parsed.length, 1);
        assert.equal(parsed[0].productId, 'premium_subscription');
        assert.equal(parsed[0].transactionId, '1000000123456789');
        assert.equal(parsed[0].bundleId, 'com.test.app');
    });

    it('Can parse StoreKit 2 subscription status with getPurchaseData()', function () {
        var iap = require('../');
        // Create a signed JWT-like mock (base64 encoded JSON payload)
        var headerPayload = {
            bundleId: 'com.test.app',
            transactionId: '2000000123456789',
            originalTransactionId: '2000000123456789',
            productId: 'monthly_subscription',
            quantity: 1,
            purchaseDate: 1609459200000,
            expiresDate: 1612137600000,
            environment: 'Sandbox'
        };
        var base64Payload = Buffer.from(JSON.stringify(headerPayload)).toString('base64');
        var mockJWS = 'eyJhbGciOiJFUzI1NiJ9.' + base64Payload + '.signature';

        var mockResponse = {
            service: iap.APPLE_STOREKIT2,
            status: 0,
            subscriptionStatus: {
                bundleId: 'com.test.app',
                environment: 'Sandbox',
                data: [
                    {
                        subscriptionGroupIdentifier: 'group123',
                        lastTransactions: [
                            {
                                status: 1,
                                signedTransactionInfo: mockJWS
                            }
                        ]
                    }
                ]
            }
        };

        var parsed = iap.getPurchaseData(mockResponse);
        assert(Array.isArray(parsed));
        assert.equal(parsed.length, 1);
        assert.equal(parsed[0].productId, 'monthly_subscription');
        assert.equal(parsed[0].subscriptionGroupIdentifier, 'group123');
    });

    it('Can filter expired items with ignoreExpired option', function () {
        var iap = require('../');
        var mockResponse = {
            service: iap.APPLE_STOREKIT2,
            status: 0,
            transactionInfo: {
                bundleId: 'com.test.app',
                transactionId: '1000000123456789',
                originalTransactionId: '1000000123456789',
                productId: 'premium_subscription',
                quantity: 1,
                purchaseDate: 1609459200000,
                originalPurchaseDate: 1609459200000,
                expiresDate: 1609459200000, // expired (in the past)
                type: 'Auto-Renewable Subscription',
                environment: 'Sandbox'
            }
        };

        var parsed = iap.getPurchaseData(mockResponse, { ignoreExpired: true });
        assert(Array.isArray(parsed));
        assert.equal(parsed.length, 0); // Should be filtered out
    });

    it('Can filter canceled items with ignoreCanceled option', function () {
        var iap = require('../');
        var mockResponse = {
            service: iap.APPLE_STOREKIT2,
            status: 0,
            transactionInfo: {
                bundleId: 'com.test.app',
                transactionId: '1000000123456789',
                originalTransactionId: '1000000123456789',
                productId: 'premium_subscription',
                quantity: 1,
                purchaseDate: 1609459200000,
                originalPurchaseDate: 1609459200000,
                revocationDate: 1610000000000, // canceled
                type: 'Auto-Renewable Subscription',
                environment: 'Sandbox'
            }
        };

        var parsed = iap.getPurchaseData(mockResponse, { ignoreCanceled: true });
        assert(Array.isArray(parsed));
        assert.equal(parsed.length, 0); // Should be filtered out
    });

    it('isValidated returns true for valid StoreKit 2 response', function () {
        var iap = require('../');
        var mockResponse = {
            service: iap.APPLE_STOREKIT2,
            status: 0,
            transactionInfo: {}
        };
        assert.equal(iap.isValidated(mockResponse), true);
    });

    it('isValidated returns false for failed StoreKit 2 response', function () {
        var iap = require('../');
        var mockResponse = {
            service: iap.APPLE_STOREKIT2,
            status: 1,
            message: 'Transaction not found'
        };
        assert.equal(iap.isValidated(mockResponse), false);
    });

    it('Returns error when validating without setup', function (done) {
        var iap = require('../');
        // Try to validate without setup
        iap.validate(iap.APPLE_STOREKIT2, 'fake-transaction-id', function (error) {
            assert(error);
            assert(error.message.includes('not initialized'));
            done();
        });
    });

    it('getSubscriptionStatus function exists and returns promise', function () {
        var iap = require('../');
        var result = iap.getSubscriptionStatus('fake-original-transaction-id');
        assert(result instanceof Promise);
    });

    it('getTransactionHistory function exists and returns promise', function () {
        var iap = require('../');
        var result = iap.getTransactionHistory('fake-transaction-id');
        assert(result instanceof Promise);
    });

    it('Can handle transaction history response with getPurchaseData()', function () {
        var iap = require('../');
        // Create mock signed transactions
        var tx1Payload = {
            bundleId: 'com.test.app',
            transactionId: '3000000123456789',
            originalTransactionId: '3000000123456789',
            productId: 'consumable_item',
            quantity: 1,
            purchaseDate: 1609459200000,
            environment: 'Sandbox'
        };
        var tx2Payload = {
            bundleId: 'com.test.app',
            transactionId: '3000000123456790',
            originalTransactionId: '3000000123456789',
            productId: 'consumable_item',
            quantity: 1,
            purchaseDate: 1612137600000,
            environment: 'Sandbox'
        };
        var mockJWS1 = 'header.' + Buffer.from(JSON.stringify(tx1Payload)).toString('base64') + '.sig';
        var mockJWS2 = 'header.' + Buffer.from(JSON.stringify(tx2Payload)).toString('base64') + '.sig';

        var mockResponse = {
            service: iap.APPLE_STOREKIT2,
            status: 0,
            transactionHistory: {
                signedTransactions: [mockJWS1, mockJWS2],
                hasMore: false,
                revision: 'abc123'
            }
        };

        var parsed = iap.getPurchaseData(mockResponse);
        assert(Array.isArray(parsed));
        // Should have 1 item (deduplicated by originalTransactionId)
        assert.equal(parsed.length, 1);
        assert.equal(parsed[0].productId, 'consumable_item');
    });

});
