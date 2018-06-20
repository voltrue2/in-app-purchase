
const fs = require('fs');
const pkg = require('../../../package.json');
const util = require('../../../lib/util');
const Linter = require('eslint').Linter;
const linter = new Linter();

const MAX_SOURCE_LEN = 100;
const HIDDEN = '/.';
const JS = '.js';
const MOD_PATH = 'node_modules/';
const GREY = '0;90';
const DARK_BLUE = '0;34';
const GREEN = '0;32';
const BROWN = '0;33';
const RED = '0;31';

var conf = pkg.eslintConfig;

module.exports = {
    start: start
};

function getRootPath() {
    return '../../../';
}

function start(path, _packagePath, ignores, cb) {
    var packagePath = getPackagePath(_packagePath);    
    try {
        conf = require(packagePath + '/package.json').eslintConfig;
        process.stdout.write(color(
            'Lint loading ' + packagePath +
            '/package.json' + ' as configuration', GREY) + '\n'
        );
    } catch (err) {
        process.stdout.write(color(
            'Lint loading ' + __dirname +
            '/../../../package.json as configuration', GREY) + '\n'
        );
    }
    util.walkDir(path, function (error, list) {
        if (error) {
            return cb(error);
        }
        var failed = lint(path, ignores, list);
        cb(failed);
    });
}

function getPackagePath(path, lastTry) {
    if (!path) {
        return process.cwd();
    }
    try {
        fs.statSync(path);
    } catch (err) {
        if (lastTry) {
            return process.cwd();
        }
        return getPackagePath(getRootPath() + path, true);
    }
    return path;
}

function lint(path, ignores, list) {
    for (var i = 0, len = list.length; i < len; i++) {
        var error = _onEachLint(path, ignores, list[i]);
        if (error) {
            return error;
        }
    }
    return null;
}

function _onEachLint(path, ignores, item) {
    var pathFragment = item.file.replace(path, '');
    if (pathFragment.indexOf(MOD_PATH) === 0) {
        return;
    }
    if (item.file.indexOf(HIDDEN) !== -1) {
        return;
    }
    if (!isJs(item.file)) {
        return;
    }
    if (ignores && ignores.length) {
        for (var i = 0, len = ignores.length; i < len; i++) {
            if (pathFragment.indexOf(ignores[i]) !== 0) {
                continue;
            }
            var skip = color(
                'Lint [ ', GREY) +
                color('Ignore', DARK_BLUE) +
                color(' ] ' + item.file, GREY
            );
            process.stdout.write(skip + '\n');
            return;
        }
    }
    return _exec(item.file);
}

function _exec(file) {
    try {
        return _onExec(file, fs.readFileSync(file, 'utf8'));
    } catch (error) {
        // failed to open the file to lint...
        return error;
    }
}

function _onExec(file, data) {
    var msg = linter.verify(data, conf);
    if (!msg.length) {
        // no error!
        var good = color('Lint [ ', GREY) + color('OK', GREEN) + color(' ] ' + file, GREY);
        process.stdout.write(good + '\n');
        return;
    }
    // if there are errors...
    var error = print(file, msg);
    if (error) {
        return new Error('lint error: ' + file);
    }
    return;
}

function isJs(path) {
    var index = path.lastIndexOf('.');
    var ext = path.substring(index);
    return ext === JS;
}

function print(file, msg) {
    var error = false;
    for (var i = 0, len = msg.length; i < len; i++) {
        var item = msg[i];
        if (item.severity === 2) {
            error = true;
        }
        process.stdout.write(
            color('Lint [', GREY) +
            getSeverity(item.severity) +
            color('] ' + file + ' Line:' + item.line + ' Column:' + item.column, GREY) +
            '\n' +
            color('[', GREY) +
            getType(item.severity, item.nodeType) +
            getMessage(item.severity, item.message) +
            color(']', GREY) +
            '\n' +
            '{' + color(item.ruleId, GREY) + '} ' +
            getSource(color(item.source, GREY)) + '\n'
        );
    }
    return error;
}

function getSeverity(severity) {
    switch (severity) {
        case 1:
            return color('Warning', BROWN);
        case 2:
            return color('Error', RED);
        default:
            return color('Info', DARK_BLUE);    
    }
}

function getType(severity, type) {
    type = '<' + type + '>';
    switch (severity) {
        case 1:
            return color(type, BROWN);
        case 2:
            return color(type, RED);
        default:
            return color(type, DARK_BLUE);    
    }
}

function getMessage(severity, msg) {
    switch (severity) {
        case 1:
            return color(msg, BROWN);
        case 2:
            return color(msg, RED);
        default:
            return color(msg, DARK_BLUE);    
    }
}

function getSource(source) {
    if (source.length > MAX_SOURCE_LEN) {
        return source.substring(0, MAX_SOURCE_LEN) + '...';
    }
    return source;
}

function color(val, code) {
    return '\x1b[' + code + 'm' + val + '\x1b[0m';
}

