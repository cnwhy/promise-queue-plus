(function (name, factory) {
	if (typeof define === 'function' && (define.amd || define.cmd)) {
		define([], factory);
	} else if (typeof window !== "undefined" || typeof self !== "undefined") {
		var global = typeof window !== "undefined" ? window : self;
		global[name] = factory();
	} else {
		throw new Error('Loading the "' + name + '" module failed!');
	}
}('PromiseQueuePlus', function () {
	return require('../src/queue')(Promise);
}));