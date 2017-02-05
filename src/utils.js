'use strict';

exports.isArray = function(obj){
	return Object.prototype.toString.call(obj) == "[object Array]"
}

exports.isFunction = function(obj){
	return typeof obj === "function"
}

exports.isObject = function(obj){
	return typeof obj === "object" && obj !== null
}

exports.arg2arr = function(arg,b,s){
	return Array.prototype.slice.call(arg,b,s);
}