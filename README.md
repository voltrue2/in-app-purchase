# in-app-purchase

This repository is a fork of the [voltrue2/in-app-purchase](https://github.com/voltrue2/in-app-purchase) repository. This Node.js module is used to manage in-app purchases for iOS, Android, Amazon, and Windows platforms.

Important changes made after forking:
1. Added a feature to validate Android purchases using the default service account when running in Google Cloud Function, without needing to provide `googleServiceAccount` `clientEmail` and `privateKey`. To use this feature, set the `googleCloudUse` parameter to `true` in the `iap.config`.

   ```javascript
   iap.config({
       googleCloudUse: true, // Use Google Cloud API for validation
   });



