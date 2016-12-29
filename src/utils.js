'use strict';
// exports.isPlainObject = function(obj) {
// 	if (obj === null || typeof(obj) !== "object" || obj.nodeType || (obj === obj.window)) {
// 		return false;
// 	}
// 	if (obj.constructor && !Object.prototype.hasOwnProperty.call(obj.constructor.prototype, "isPrototypeOf")) {
// 		return false;
// 	}
// 	return true;
// }

exports.isArray = function(obj){
	return Object.prototype.toString.call(obj) == "[object Array]"
}

exports.isFunction = function(obj){
	return typeof obj === "function"
}

exports.isObject = function(obj){
	return typeof obj === "object" && obj !== null
}

// exports.isEmpty = function(obj){
// 	return typeof obj == 'undefined' || obj === null;
// }

exports.arg2arr = function(arg,b,s){
	return Array.prototype.slice.call(arg,b,s);
}