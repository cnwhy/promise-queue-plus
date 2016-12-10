(function (name, factory) {
    if (typeof process === "object" && typeof module === "object" && typeof module.exports === "object" ) {
        module.exports = factory();
    } else if (typeof define === 'function' && (define.amd || define.cmd)) {
        define([], factory);
    } else if (typeof window !== "undefined" || typeof self !== "undefined") {
        var global = typeof window !== "undefined" ? window : self;
        global[name] = factory();
    } else {
        throw new Error("加载 " + name + " 模块失败！，请检查您的环境！")
    }
})('QueueFun', function () {
	return {
		Queue: require('./lib/Queue.js'),
		Q: require('./lib/Q.js')
	};
})