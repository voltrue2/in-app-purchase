'use strict';

var verbose = require('./verbose');
var constants = require('../constants');

// Apple's official App Store Server Library
var AppleServerLibrary = require('@apple/app-store-server-library');

var config = null;
var appStoreServerAPIClient = null;
var signedDataVerifier = null;

// Environment mapping
var Environment = AppleServerLibrary.Environment;

function isValidConfigKey(key) {
    return key.match(/^appleStoreKit2/);
}

module.exports.readConfig = function (configIn) {
    if (!configIn) {
        return;
    }

    // set up verbose logging
    verbose.setup(configIn);

    config = {};
    var configValueSet = false;

    Object.keys(configIn).forEach(function (key) {
        if (isValidConfigKey(key)) {
            config[key] = configIn[key];
            configValueSet = true;
        }
    });

    // Also accept nested config under 'appleStoreKit2' key
    if (configIn.appleStoreKit2 && typeof configIn.appleStoreKit2 === 'object') {
        config = configIn.appleStoreKit2;
        configValueSet = true;
    }

    if (!configValueSet) {
        config = null;
    }
};

module.exports.setup = function (cb) {
    if (!config) {
        verbose.log('<AppleStoreKit2> No configuration found');
        return cb();
    }

    var issuerId = config.issuerId || config.appleStoreKit2IssuerId || process.env.APPLE_STOREKIT2_ISSUER_ID;
    var keyId = config.keyId || config.appleStoreKit2KeyId || process.env.APPLE_STOREKIT2_KEY_ID;
    var bundleId = config.bundleId || config.appleStoreKit2BundleId || process.env.APPLE_STOREKIT2_BUNDLE_ID;
    var privateKey = config.privateKey || config.appleStoreKit2PrivateKey || process.env.APPLE_STOREKIT2_PRIVATE_KEY;
    var environment = config.environment || config.appleStoreKit2Environment || process.env.APPLE_STOREKIT2_ENVIRONMENT || 'Production';
    var appAppleId = config.appAppleId || config.appleStoreKit2AppAppleId || process.env.APPLE_STOREKIT2_APP_APPLE_ID;

    if (!issuerId || !keyId || !bundleId || !privateKey) {
        verbose.log('<AppleStoreKit2> Missing required configuration (issuerId, keyId, bundleId, privateKey)');
        return cb();
    }

    try {
        // Determine environment
        var env = environment.toLowerCase() === 'sandbox' ? Environment.SANDBOX : Environment.PRODUCTION;

        // Create App Store Server API Client
        appStoreServerAPIClient = new AppleServerLibrary.AppStoreServerAPIClient(
            privateKey,
            keyId,
            issuerId,
            bundleId,
            env
        );

        // Create Signed Data Verifier for verifying JWS transactions
        // appAppleId is required for SignedDataVerifier
        if (appAppleId) {
            signedDataVerifier = new AppleServerLibrary.SignedDataVerifier(
                AppleServerLibrary.APPLE_ROOT_CA_G3_FINGERPRINTS,
                true, // enableOnlineChecks
                env,
                bundleId,
                appAppleId
            );
        }

        verbose.log('<AppleStoreKit2> Setup complete with environment:', environment);
        cb();
    } catch (error) {
        verbose.log('<AppleStoreKit2> Setup error:', error);
        cb(error);
    }
};

/**
 * Validate a purchase using transaction ID
 * @param {string} transactionId - The transaction ID from StoreKit 2
 * @param {function} cb - Callback function(error, validatedData)
 */
module.exports.validatePurchase = function (transactionId, cb) {
    if (!appStoreServerAPIClient) {
        return cb(new Error('AppleStoreKit2 client is not initialized. Call setup() first.'));
    }

    if (!transactionId) {
        return cb(new Error('transactionId is required'));
    }

    verbose.log('<AppleStoreKit2> Validating transaction:', transactionId);

    appStoreServerAPIClient.getTransactionInfo(transactionId)
        .then(function (transactionInfoResponse) {
            verbose.log('<AppleStoreKit2> Transaction info received');

            var signedTransactionInfo = transactionInfoResponse.signedTransactionInfo;

            // If we have a verifier, verify the signed transaction
            if (signedDataVerifier && signedTransactionInfo) {
                return signedDataVerifier.verifyAndDecodeTransaction(signedTransactionInfo)
                    .then(function (decodedTransaction) {
                        var result = {
                            service: constants.SERVICES.APPLE_STOREKIT2,
                            status: constants.VALIDATION.SUCCESS,
                            transactionInfo: decodedTransaction,
                            signedTransactionInfo: signedTransactionInfo,
                            sandbox: decodedTransaction.environment === 'Sandbox'
                        };
                        verbose.log('<AppleStoreKit2> Transaction verified successfully');
                        cb(null, result);
                    });
            } else {
                // Without verifier, we trust the API response but decode JWT manually
                var result = {
                    service: constants.SERVICES.APPLE_STOREKIT2,
                    status: constants.VALIDATION.SUCCESS,
                    signedTransactionInfo: signedTransactionInfo,
                    transactionInfo: decodeJWSPayload(signedTransactionInfo),
                    sandbox: false // Will be determined from decoded payload
                };

                if (result.transactionInfo && result.transactionInfo.environment) {
                    result.sandbox = result.transactionInfo.environment === 'Sandbox';
                }

                cb(null, result);
            }
        })
        .catch(function (error) {
            verbose.log('<AppleStoreKit2> Validation error:', error);

            var errorResult = {
                service: constants.SERVICES.APPLE_STOREKIT2,
                status: constants.VALIDATION.FAILURE,
                message: error.message || 'Unknown error'
            };

            // Handle specific API errors
            if (error.apiError) {
                errorResult.apiError = error.apiError;
                errorResult.errorCode = error.apiError;
            }

            cb(error, errorResult);
        });
};

/**
 * Get subscription status using original transaction ID
 * @param {string} originalTransactionId - The original transaction ID
 * @param {function} cb - Callback function(error, statusData)
 */
module.exports.getSubscriptionStatus = function (originalTransactionId, cb) {
    if (!appStoreServerAPIClient) {
        return cb(new Error('AppleStoreKit2 client is not initialized. Call setup() first.'));
    }

    if (!originalTransactionId) {
        return cb(new Error('originalTransactionId is required'));
    }

    verbose.log('<AppleStoreKit2> Getting subscription status for:', originalTransactionId);

    appStoreServerAPIClient.getAllSubscriptionStatuses(originalTransactionId)
        .then(function (statusResponse) {
            verbose.log('<AppleStoreKit2> Subscription status received');

            var result = {
                service: constants.SERVICES.APPLE_STOREKIT2,
                status: constants.VALIDATION.SUCCESS,
                subscriptionStatus: statusResponse,
                bundleId: statusResponse.bundleId,
                environment: statusResponse.environment,
                sandbox: statusResponse.environment === 'Sandbox'
            };

            cb(null, result);
        })
        .catch(function (error) {
            verbose.log('<AppleStoreKit2> Subscription status error:', error);

            var errorResult = {
                service: constants.SERVICES.APPLE_STOREKIT2,
                status: constants.VALIDATION.FAILURE,
                message: error.message || 'Unknown error'
            };

            cb(error, errorResult);
        });
};

/**
 * Get transaction history for a user
 * @param {string} transactionId - Any transaction ID for the user
 * @param {object} options - Optional parameters (revision, etc.)
 * @param {function} cb - Callback function(error, historyData)
 */
module.exports.getTransactionHistory = function (transactionId, options, cb) {
    if (typeof options === 'function') {
        cb = options;
        options = {};
    }

    if (!appStoreServerAPIClient) {
        return cb(new Error('AppleStoreKit2 client is not initialized. Call setup() first.'));
    }

    if (!transactionId) {
        return cb(new Error('transactionId is required'));
    }

    verbose.log('<AppleStoreKit2> Getting transaction history for:', transactionId);

    var request = new AppleServerLibrary.TransactionHistoryRequest();
    if (options.revision) {
        request.revision = options.revision;
    }

    appStoreServerAPIClient.getTransactionHistory(transactionId, request)
        .then(function (historyResponse) {
            verbose.log('<AppleStoreKit2> Transaction history received');

            var result = {
                service: constants.SERVICES.APPLE_STOREKIT2,
                status: constants.VALIDATION.SUCCESS,
                transactionHistory: historyResponse,
                hasMore: historyResponse.hasMore,
                revision: historyResponse.revision
            };

            cb(null, result);
        })
        .catch(function (error) {
            verbose.log('<AppleStoreKit2> Transaction history error:', error);

            cb(error, {
                service: constants.SERVICES.APPLE_STOREKIT2,
                status: constants.VALIDATION.FAILURE,
                message: error.message || 'Unknown error'
            });
        });
};

/**
 * Parse purchase data from StoreKit 2 validation response
 * @param {object} purchase - The validated purchase response
 * @param {object} options - Optional parsing options (ignoreExpired, ignoreCanceled)
 * @returns {Array} Array of parsed purchase data
 */
module.exports.getPurchaseData = function (purchase, options) {
    if (!purchase) {
        return null;
    }

    var data = [];
    options = options || {};
    var now = Date.now();

    // Handle transaction info from validatePurchase
    if (purchase.transactionInfo) {
        var txInfo = purchase.transactionInfo;
        var parsed = parseTransactionInfo(txInfo);

        // Apply filters
        if (options.ignoreCanceled && parsed.cancellationDate) {
            return data;
        }

        if (options.ignoreExpired && parsed.expirationDate && now >= parsed.expirationDate) {
            return data;
        }

        data.push(parsed);
    }

    // Handle subscription status from getSubscriptionStatus
    if (purchase.subscriptionStatus && purchase.subscriptionStatus.data) {
        var subscriptionGroups = purchase.subscriptionStatus.data;

        for (var i = 0; i < subscriptionGroups.length; i++) {
            var group = subscriptionGroups[i];

            if (group.lastTransactions) {
                for (var j = 0; j < group.lastTransactions.length; j++) {
                    var lastTx = group.lastTransactions[j];

                    // Decode the signed transaction info if needed
                    var txData;
                    if (lastTx.signedTransactionInfo) {
                        txData = decodeJWSPayload(lastTx.signedTransactionInfo);
                    }

                    if (txData) {
                        var parsedSub = parseTransactionInfo(txData);
                        parsedSub.status = lastTx.status;
                        parsedSub.subscriptionGroupIdentifier = group.subscriptionGroupIdentifier;

                        // Apply filters
                        if (options.ignoreCanceled && parsedSub.cancellationDate) {
                            continue;
                        }

                        if (options.ignoreExpired && parsedSub.expirationDate && now >= parsedSub.expirationDate) {
                            continue;
                        }

                        data.push(parsedSub);
                    }
                }
            }
        }
    }

    // Handle transaction history
    if (purchase.transactionHistory && purchase.transactionHistory.signedTransactions) {
        var signedTransactions = purchase.transactionHistory.signedTransactions;
        var processedTxIds = {};

        for (var k = 0; k < signedTransactions.length; k++) {
            var signedTx = signedTransactions[k];
            var decodedTx = decodeJWSPayload(signedTx);

            if (decodedTx) {
                var txId = decodedTx.originalTransactionId || decodedTx.transactionId;

                // Avoid duplicates
                if (processedTxIds[txId]) {
                    continue;
                }
                processedTxIds[txId] = true;

                var parsedHistory = parseTransactionInfo(decodedTx);

                // Apply filters
                if (options.ignoreCanceled && parsedHistory.cancellationDate) {
                    continue;
                }

                if (options.ignoreExpired && parsedHistory.expirationDate && now >= parsedHistory.expirationDate) {
                    continue;
                }

                data.push(parsedHistory);
            }
        }
    }

    return data;
};

/**
 * Check if a StoreKit 2 response indicates a valid purchase
 * @param {object} response - The validation response
 * @returns {boolean}
 */
module.exports.isValidated = function (response) {
    if (!response) {
        return false;
    }
    return response.status === constants.VALIDATION.SUCCESS;
};

/**
 * Parse transaction info into standardized format
 * @param {object} txInfo - Transaction info from App Store Server API
 * @returns {object} Parsed transaction data
 */
function parseTransactionInfo(txInfo) {
    // Map StoreKit 2 fields to standard format
    return {
        bundleId: txInfo.bundleId,
        transactionId: String(txInfo.transactionId),
        originalTransactionId: String(txInfo.originalTransactionId || txInfo.transactionId),
        productId: txInfo.productId,
        quantity: txInfo.quantity || 1,
        purchaseDate: txInfo.purchaseDate,
        originalPurchaseDate: txInfo.originalPurchaseDate,
        expirationDate: txInfo.expiresDate || 0,
        cancellationDate: txInfo.revocationDate || 0,
        cancellationReason: txInfo.revocationReason,
        isTrial: txInfo.offerType === 1, // 1 = introductory offer (can be trial)
        isUpgrade: txInfo.isUpgraded || false,
        webOrderLineItemId: txInfo.webOrderLineItemId,
        subscriptionGroupIdentifier: txInfo.subscriptionGroupIdentifier,
        environment: txInfo.environment,
        inAppOwnershipType: txInfo.inAppOwnershipType,
        type: txInfo.type, // 'Auto-Renewable Subscription', 'Non-Consumable', etc.
        appAccountToken: txInfo.appAccountToken
    };
}

/**
 * Decode JWS payload without verification (for basic parsing)
 * @param {string} jws - JWS string
 * @returns {object|null} Decoded payload
 */
function decodeJWSPayload(jws) {
    if (!jws || typeof jws !== 'string') {
        return null;
    }

    try {
        var parts = jws.split('.');
        if (parts.length !== 3) {
            return null;
        }

        var payload = parts[1];
        // Base64url decode
        payload = payload.replace(/-/g, '+').replace(/_/g, '/');
        var decoded = Buffer.from(payload, 'base64').toString('utf-8');
        return JSON.parse(decoded);
    } catch (error) {
        verbose.log('<AppleStoreKit2> Failed to decode JWS:', error);
        return null;
    }
}

// For testing purposes
module.exports.reset = function () {
    config = null;
    appStoreServerAPIClient = null;
    signedDataVerifier = null;
};
