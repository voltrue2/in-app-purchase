'use strict';

/**
async library is not v8 crankshft friendly at all
and we wanto support node.js that does not support Promise
*/

module.exports = {
    eachSeries: eachSeries,
    forEachSeries: eachSeries,
    // eachSeries/forEachSeries w/ extra parameters
    loopSeries: loopSeries,
    each: eachSeries,
    forEach: eachSeries,
    series: series,
    promiseAll: promiseAll
};

function promiseAll(promiseList) {
    if (!promiseList || !Array.isArray(promiseList) || !promiseList.length) {
        return new Promise(_onEmptyPromiseList);
    }
    var promise = promiseList[0]();
    if (promise instanceof Promise === false) {
        return new Promise(_onInvalidPromiseInList.bind(null, { index: 0 }));
    }
    for (var i = 1, len = promiseList.length; i < len; i++) {
        promise = promise.then(promiseList[i]);
        if (promise instanceof Promise === false) {
            return new Promise(_onInvalidPromiseInList.bind(null, { index: i }));
        }
    }
    return promise;
}

function _onEmptyPromiseList(resolve) {
    resolve();
}

function _onInvalidPromiseInList(bind, resolve, reject) {
    reject(new Error('Not promise in list at', bind.index));
}

function eachSeries(list, each, cb, _index) {
    if (!list || !list.length) {
        return _finish(cb);
    }
    var item = list[0];
    if (item === undefined) {
        return _finish(cb);
    }
    if (!_index) {
        _index = 0;
    }
    each(item, _onEachSeries.bind(null, {
        list: list.slice(1),
        each: each,
        cb: cb,
        index: _index 
    }), _index);
}

function _onEachSeries(bind, error) {
    if (error) {
        return _finish(bind.cb, error);
    }
    eachSeries(bind.list, bind.each, bind.cb, bind.index + 1);
}

function loopSeries(list, params, each, cb, _index) {
    if (!list || !list.length) {
        return _finish(cb);
    }
    var item = list[0];
    if (item === undefined) {
        return _finish(cb);
    }
    if (!_index) {
        _index = 0;
    }
    each(item, params, _onLoopSeries.bind(null, {
        list: list.slice(1),
        params: params,
        each: each,
        cb: cb,
        index: _index
    }), _index);
}

function _onLoopSeries(bind, error) {
    if (error) {
        return _finish(bind.cb, error);
    }
    loopSeries(
        bind.list,
        bind.params,
        bind.each,
        bind.cb,
        bind.index + 1
    );
}

function series(list, cb) {
    if (!list || !list.length) {
        return _finish(cb);
    }
    var item = list[0];
    if (item === undefined) {
        return _finish(cb);
    }
    if (typeof item !== 'function') {
        return _finish(cb, new Error('FoundNonFunctionInList'));
    }
    item(_onSeries.bind(null, {
        list: list.slice(1),
        cb: cb
    }));
}

function _onSeries(bind, error) {
    if (error) {
        return _finish(bind.cb, error);
    }
    series(bind.list, bind.cb);
}

function _finish(cb, error) {
    if (typeof cb === 'function') {
        cb(error);
    }
}

