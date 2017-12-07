var epc = require("extend-promise/src/extendClass");

exports.isArray = function (obj) {
	return Object.prototype.toString.call(obj) == "[object Array]";
}

exports.isFunction = function (obj) {
	return typeof obj === "function";
}

exports.isObject = function (obj) {
	return typeof obj === "object" && obj !== null
}

exports.arg2arr = function (arg, b, s) {
	return Array.prototype.slice.call(arg, b, s);
}

exports.toArray = function () {
	return Array.prototype.concat.apply([], arguments);
}

/**
 * 将值修整为正整数，0与负数报错
 * @param {Number} max 
 */
exports.getPositiveInt = function (max) {
	var _max = (+max) >> 0;
	if (_max >= 1) {
		return _max;
	} else {
		throw new Error('The "max" value is invalid')
	}
}
/**
 * 扩展Promise
 * @param {Promise} Promise 
 */
exports.extendPromise = function (Promise) {
	return epc(Promise, {});
}

exports.runFn2Promise = function (Promise,fn) {
	try{
		return Promise.resolve(fn());
	}catch(e){
		return Promise.reject(e);
	}
}