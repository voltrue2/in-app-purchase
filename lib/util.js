'use strict';

const fs = require('fs');

module.exports.walkDir = function __libWalkDir(path, cb) {
    var res = [];
    var pending = 0;
    var eachWalk = function __libEachWalk(error, results) {
        if (error) {
            return cb(error);
        }
        res = res.concat(results);
        pending--;
        if (!pending) {
            return cb(null, res);
        }
    };
    fs.lstat(path, function __libWalkOnStat(error, stat) {
        if (error) {
            return cb(error);
        }
        if (!stat.isDirectory()) {
            res.push({ file: path, stat: stat });
            return cb(null, res);
        }
        fs.readdir(path, function __libWalkOnReaddir(error, list) {
            if (error) {
                return cb(error);
            }
            pending += list.length;
            if (!pending) {
                return cb(null, res);
            }
            for (var i = 0, len = list.length; i < len; i++) {
                var file = list[i];
                var slash = path.substring(path.length - 1) !== '/' ? '/' : '';
                var filePath = path + slash + file;
                module.exports.walkDir(filePath, eachWalk);
            }
        });
    });
};

