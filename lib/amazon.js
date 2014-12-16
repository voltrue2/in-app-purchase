var constants = require('../constants');
var request = require('request');
var async = require('async');

var VER = '2.0';
var SECRET = '{developerSecret}';
var UID = '{userId}';
var PTOKEN = '{purchaseToken}';
var ERRORS = {
	validation: {
		400: 'The transaction represented by this Purchase Token is no longer valid.',
		496: 'Invalid sharedSecret',
		497: 'Invalid User ID',
		498: 'Invalid Purchase Token',
		499: 'The Purchase Token was created with credentials that have expired, use renew to generate a valid purchase token.',
		500: 'There was an Internal Server Error'
	},
	renew: {
		400: 'Bad Request',
		496: 'Invalid sharedSecret',
		497: 'Invalid User ID',
		498: 'Invalid Purchase Token',
		500: 'There is an Internal Server Error'
	}
};

var VALIDATION_PATH = 'https://appstore-sdk.amazon.com/version/' + VER + '/verify/developer/' + SECRET + '/user/' + UID + '/purchaseToken/' + PTOKEN;
var RENEW_PATH = 'https://appstore-sdk.amazon.com/version/' + VER + '/renew/developer/' + SECRET + '/user/' + UID + '/purchaseToken/' + PTOKEN;


