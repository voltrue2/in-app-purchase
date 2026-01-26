'use strict';

// services
exports.SERVICES = {
	UNITY: 'unity',
	APPLE: 'apple',
	APPLE_STOREKIT2: 'apple_storekit2',
	GOOGLE: 'google',
	WINDOWS: 'windows',
	AMAZON: 'amazon',
	ROKU: 'roku',
	FACEBOOK: 'facebook'
};

exports.UNITY = {
	APPLE: 'AppleAppStore',
	APPLE_STOREKIT2: 'AppleAppStore', // Same Unity store, different validation method
	GOOGLE: 'GooglePlay',
	AMAZON: 'AmazonApps'
};

// validation
exports.VALIDATION = {
	SUCCESS: 0,
	FAILURE: 1,
	POSSIBLE_HACK: 2
};
