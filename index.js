var apple = require('./apple');
var google = require('./google');
var windows = require('./windows');

module.exports.APPLE = 'apple';

module.exports.GOOGLE = 'google';

module.exports.WINDOWS = 'windows';

module.exports.config = function (configIn) {
	google.readConfig(configIn);
};

module.exports.setup = function (cb) {
	google.setup(cb);
};

module.exports.validate = function (service, receipt, cb) {
	var validator;
	switch (service) {
		case module.exports.APPLE:
			validator = apple.validatePurchase;
			break;
		case module.exports.GOOGLE:
			validator = google.validatePurchase;
			break;
		case module.exports.WINDOWS:
			validator = windows.validatePurchase;
			break;
		default:
			return cb(new Error('invalid service given: ' + service));
	}
	validator(receipt, function (error, response) {
		if (error) {
			return cb(error);
		}
		cb(null, response);
	});		
};

module.exports.isValidated = function (response) {
	if (response && response.status === 0) {
		return true;
	}
	return false;
};
