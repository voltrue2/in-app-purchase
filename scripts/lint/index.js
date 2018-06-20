'use strict';

var linter = require('./linter');

module.exports = function __lintIndex(path, packagePath, ignorelist, cb) {
    linter.start(path, packagePath, ignorelist, function __lintIndexOnStart(error) {
        if (error) {
            return cb(error);
        }
        cb();
    });
};
