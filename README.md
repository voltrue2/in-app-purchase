# in-app-purchase

This repository is a fork of the [voltrue2/in-app-purchase](https://github.com/voltrue2/in-app-purchase) repository. This Node.js module is used to manage in-app purchases for iOS, Android, Amazon, and Windows platforms.

Important changes made after forking:
1. Added a feature to validate Android purchases using the default service account when running in Google Cloud Function, without needing to provide `googleServiceAccount` `clientEmail` and `privateKey`. To use this feature, set the `googleCloudUse` parameter to `true` in the `iap.config`.

   ```javascript
   iap.config({
       googleCloudUse: true, // Use Google Cloud API for validation
   });
   ```

2. **Added StoreKit 2 support for iOS** using Apple's App Store Server API. This is the modern replacement for the deprecated `verifyReceipt` endpoint.

3. **Automatic StoreKit 2 Upgrade for Unity Receipts**: If you are using the Unity IAP plugin and provide an Apple receipt object, the library will automatically upgrade to StoreKit 2 validation if the `appleStoreKit2` configuration is present and the receipt contains a `TransactionID`. This allows you to migrate to StoreKit 2 without changing your client-side implementation.

   ```javascript
   // If configured, this Unity receipt will automatically use StoreKit 2
   let receipt = {
       "Store": "AppleAppStore",
       "TransactionID": "2000001110285660",
       "Payload": "...", 
       "Subscription": false
   };
   const response = await iap.validate(receipt);
   ```

## StoreKit 2 (App Store Server API)

StoreKit 2 uses Apple's new App Store Server API which provides:
- JWT-based authentication (more secure)
- JWS-signed transactions (cryptographic verification)
- Real-time subscription status
- Cleaner and more structured API responses

### Prerequisites

You need the following from your [App Store Connect](https://appstoreconnect.apple.com) account:

1. **Issuer ID**: Found under "Users and Access" > "Integrations" > "App Store Connect API"
2. **Key ID**: Generated when creating an API key
3. **Private Key (.p8 file)**: Downloaded when creating the API key (can only be downloaded once!)
4. **Bundle ID**: Your app's bundle identifier
5. **App Apple ID** (optional): Your app's Apple ID (for JWS verification)

### Configuration

```javascript
const iap = require('in-app-purchase');
const fs = require('fs');

iap.config({
    appleStoreKit2: {
        issuerId: 'YOUR_ISSUER_ID',
        keyId: 'YOUR_KEY_ID',
        privateKey: fs.readFileSync('path/to/AuthKey.p8', 'utf-8'),
        bundleId: 'com.yourapp.bundleid',
        environment: 'Production', // or 'Sandbox' for testing
        appAppleId: 12345678 // Optional: enables JWS verification
    }
});
```

You can also use environment variables:
- `APPLE_STOREKIT2_ISSUER_ID`
- `APPLE_STOREKIT2_KEY_ID`
- `APPLE_STOREKIT2_PRIVATE_KEY`
- `APPLE_STOREKIT2_BUNDLE_ID`
- `APPLE_STOREKIT2_ENVIRONMENT`
- `APPLE_STOREKIT2_APP_APPLE_ID`

### Validating a Transaction

```javascript
await iap.setup();

// Validate using transaction ID from StoreKit 2
// (First tries configured environment, if not found (404), tries the other one automatically)
const result = await iap.validate(iap.APPLE_STOREKIT2, transactionId);

if (iap.isValidated(result)) {
    const purchaseData = iap.getPurchaseData(result);
    console.log('Purchase validated:', purchaseData);
}
```

### Dual Environment Support (Sandbox & Production)

Similar to the legacy `verifyReceipt` implementation, the `iap.APPLE_STOREKIT2` service supports **automatic environment fallback**:

1. Validations are first attempted in the configured `environment` (default: `Production`).
2. If the transaction is not found (404 error) in the primary environment, the system automatically retries in the other environment (`Sandbox` if primary is `Production`, and vice versa).
3. This ensures that purchases made by TestFlight users or Sandbox accounts are validated correctly even when the app is configured for Production.

### Getting Subscription Status

```javascript
// Get subscription status using original transaction ID
const status = await iap.getSubscriptionStatus(originalTransactionId);
const subscriptionData = iap.getPurchaseData(status);
```

### Getting Transaction History

```javascript
// Get all transactions for a user
const history = await iap.getTransactionHistory(transactionId);
const allPurchases = iap.getPurchaseData(history);
```

### Purchase Data Fields (StoreKit 2)

The `getPurchaseData()` function returns an array of parsed purchases with the following fields:

| Field | Description |
|-------|-------------|
| `bundleId` | App bundle identifier |
| `transactionId` | Unique transaction ID |
| `originalTransactionId` | Original transaction ID (for renewals) |
| `productId` | Product identifier |
| `quantity` | Number of items purchased |
| `purchaseDate` | Purchase timestamp (ms) |
| `expirationDate` | Subscription expiration timestamp (ms) |
| `cancellationDate` | Cancellation/revocation timestamp (ms) |
| `isTrial` | Whether this is a trial period |
| `type` | Product type (e.g., "Auto-Renewable Subscription") |
| `environment` | "Production" or "Sandbox" |

### Migration from Legacy Apple Validation

The legacy `iap.APPLE` validation using `verifyReceipt` is still available but deprecated. To migrate:

| Legacy (iap.APPLE) | StoreKit 2 (iap.APPLE_STOREKIT2) |
|-------------------|----------------------------------|
| Uses encoded receipt | Uses transaction ID |
| `verifyReceipt` endpoint | App Store Server API |
| Shared secret | JWT authentication |

```javascript
// Legacy (still works)
iap.validate(iap.APPLE, encodedReceipt, callback);

// StoreKit 2 (recommended)
iap.validate(iap.APPLE_STOREKIT2, transactionId, callback);
```


