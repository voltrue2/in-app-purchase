'use strict';

var http = require('http');
var https = require('https');

module.exports = function (options, cb) {
	send(options.method, options, cb);
};

module.exports.post = function (options, cb) {
	send('POST', options, cb);
};

module.exports.put = function (options, cb) {
	send('PUT', options, cb);
};

module.exports.del = function (options, cb) {
	send('DELETE', options, cb);
};

module.exports.patch = function (options, cb) {
	send('PATCH', options, cb);
};

module.exports.get = function (options, cb) {
	send('GET', options, cb);
};

module.exports.head = function (options, cb) {
	send('HEAD', options, cb);
};

function send(method, options, cb) {

	if (typeof options === 'string')  {
		options = {
			url: options,
			body: null	
		};
	}

	var bodyData = qstring(options.body, options || {});
	var opts = createOptions(method, bodyData, options || {});
	opts.headers = addHeaders(opts.headers, options || {});
	var proto = opts.port === 443 ? https : http;
	var req = proto.request(opts, function (res) {
		res.setEncoding('utf8');
		var data = '';
		res.on('data', function (chunk) {
			data += chunk;
		});
		res.on('end', function () {
			try {
				cb(null, res, JSON.parse(data));
			} catch (e) {
				cb(null, res, data);
			}
		});
	});
	req.on('error', cb);
	
	if (bodyData) {
		req.write(bodyData);
	}

	req.end();
}

function qstring(body, options) {
	
	if (!body) {
		return '';
	}

	if (options.json) {
		return JSON.stringify(body);
	}

	var q = [];
	for (var name in body) {
		q.push(
			encodeURIComponent(name) +
			'=' +
			encodeURIComponent(body[name])
		);
	}
	return q.join('&');
}

function createOptions(method, data, options) {
	var url = options.url;
	var proto = url.substring(0, url.indexOf('://') + 3);
	var noProto = url.replace(proto, '');
	var host = noProto.substring(0, noProto.indexOf('/'));
	var path = noProto.substring(noProto.indexOf('/'));
	var port = options.port || (proto === 'http://' ? 80 : 443);
	var ctype = options.json ? 'application/json' : 'application/x-www-form-urlencoded';
	var opts = {
		host: host,
		port: port,
		path: path,
		method: method,
		headers: {
			'Content-Type': ctype,
			'Content-Length': Buffer.byteLength(data)
		}
	};
	return opts;
}

function addHeaders(headers, options) {
	var headersToAdd = options.headers;
	if (!headersToAdd) {
		return headers;
	}
	for (var name in headersToAdd) {
		headers[name] = headersToAdd[name];
	}
	return headers;
}
