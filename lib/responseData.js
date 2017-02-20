'use strict';

module.exports.parse = function (response) {
	var res = {};
	for (var key in response) {
		var val = response[key];
		var name = toCamelCase(key);
		if (!isNaN(val) && typeof val !== 'boolean') {
			res[name] = parseFloat(val);	
		} else {
			res[name] = val;
		}
	}
	return res;
};

function toCamelCase(str) {
	var list = str.split('_');
	var res = '';
	for (var i = 0, len = list.length; i < len; i++) {
		res += (i === 0 ? list[i][0] : list[i][0].toUpperCase()) + list[i].substring(1);
	}
	return res;
}
