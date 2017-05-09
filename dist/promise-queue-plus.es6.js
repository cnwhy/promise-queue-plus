/*!
 * promise-queue-plus v1.1.0
 * Homepage https://github.com/cnwhy/promise-queue-plus
 * License BSD-2-Clause
 */
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
},{"../src/queue":4}],2:[function(require,module,exports){
'use strict';
var utils = require('./utils')
var isArray = utils.isArray
	,isEmpty = utils.isEmpty
	,isFunction = utils.isFunction
	,isPlainObject = utils.isPlainObject
	,arg2arr = utils.arg2arr

function extendClass(Promise,obj,funnames){
	var QClass,source;
	if(obj){
		source = true
		QClass = obj;
	}else{
		QClass = Promise;
	}

	function asbind(name){
		if(isArray(funnames)){
			var nomark = false;
			for(var i = 0; i<funnames.length; i++){
				if(funnames[i] == name){
					nomark = true;
					break;
				}
			}
			if(!nomark) return false;
		}
		if(source){
			return !isFunction(QClass[name]);
		}
		return true;
	}

	if(!QClass.Promise && Promise != obj) QClass.Promise = Promise;

	//defer  defer为最基础的实现
	if(isFunction(Promise) && isFunction(Promise.prototype.then)){
		QClass.defer = function() {
			var resolve, reject;
			var promise = new Promise(function(_resolve, _reject) {
				resolve = _resolve;
				reject = _reject;
			});
			return {
				promise: promise,
				resolve: resolve,
				reject: reject
			};
		}
	}else if(isFunction(Promise.defer)){
		QClass.defer = function(){return Promise.defer();}
	}else if(isFunction(Promise.deferred)){
		QClass.defer = function(){return Promise.deferred();}
	}else{
		throw new TypeError("此类不支持扩展!")
	}

	//delay
	if(asbind("delay")){
		QClass.delay = function(ms,value){
			var defer = QClass.defer();
			setTimeout(function(){
				//console.log('==========')
				defer.resolve(value);
			},ms)
			return defer.promise;
		}
	}

	//resolve
	if(asbind("resolve")){
		QClass.resolve = function(obj){
			var defer = QClass.defer();
			defer.resolve(obj);
			return defer.promise;
		}
	}

	//reject
	if(asbind("reject")){
		QClass.reject = function(obj){
			var defer = QClass.defer();
			defer.reject(obj);
			return defer.promise;
		}
	}

	function getall(map,count){
		if(!isEmpty(count)){
			count = +count > 0 ? +count : 0; 
		}
		return function(promises) {
			var defer = QClass.defer();
			var data,_tempI = 0;
			var fillData = function(i){
				var _p = promises[i];
				QClass.resolve(_p).then(function(d) {
					if(typeof count != 'undefined'){
						data.push(d);
					}else{
						data[i] = d;
					}
					if (--_tempI == 0 || (!map && count && data.length>=count)) {
						defer.resolve(data);
					}
				}, function(err) {
					if (isEmpty(count)) {
						defer.reject(err);
					}else if(--_tempI == 0){
						defer.resolve(data);
					}
				})
				_tempI++;
			}
			if(isArray(promises)){
				data = [];
				if(promises.length == 0){defer.resolve(data)};
				for(var i = 0; i<promises.length; i++){
					fillData(i);
				}
			}else if(map && isPlainObject(promises)){
				var _mark = 0;
				data = {}
				for(var i in promises){
					fillData(i);
					_mark++;
				}
				if(_mark == 0) defer.resolve(data)
			}else{
				defer.reject(new TypeError("参数错误"));
			}
			return defer.promise;
		}
	}

	//all 
	if(asbind("all")){
		QClass.all = getall()
	}

	if(asbind("allMap")){
		QClass.allMap = getall(true);
	}

	if(asbind("some")){
		QClass.some = function(proArr,count){
			count = +count >= 0 ? +count : 0;
			return getall(false,count)(proArr)
		}
	}

	//map
	if(asbind("map")){
		QClass.map = function(data,mapfun,options){
			var defer = QClass.defer();
			var promiseArr = [];
			var concurrency = options ? +options.concurrency : 0
			//无并发控制
			if(concurrency == 0 || concurrency != concurrency){
				for(var i in data){
					promiseArr.push(mapfun(data[i],i,data));
				}	
				QClass.all(promiseArr).then(defer.resolve,defer.reject)
				return defer.promise;
			}
			var k = 0;
			var keys = (function(){
				var ks = [];
				for(var k in data){
					ks.push(k);
				}
				return ks;
			})();
			function next(){
				if(k<keys.length){
					var key = keys[k];
					var promise = QClass.resolve(mapfun(data[key],key,data)).then(function(v){
						next();
						return v;
					},defer.reject);
					promiseArr.push(promise);
					concurrency--;
					k++;
				}else{
					QClass.all(promiseArr).then(defer.resolve,defer.reject);
				}
			}
			do{
				next()
			}while(concurrency>0 && k<keys.length)

			return defer.promise
		}
	}

	function race(proArr) {
		var defer = QClass.defer();
		for (var i = 0; i < proArr.length; i++) {
			(function() {
				var _i = i;
				var _p = proArr[_i];
				QClass.resolve(_p).then(function(data) {
					defer.resolve(data);
				}, function(err) {
					defer.reject(err);
				})
			})()
		}
		return defer.promise;
	}

	//any | race
	if(asbind("race")){
		QClass.race = race;
	}
	if(asbind("any")){
		QClass.any = race;
	}

	/*封装CPS*/
	//callback Adapter 
	function cbAdapter(defer){
		return function(err,data){
			if(err) return defer.reject(err);
			defer.resolve(data)
		}
	}
	function nfcall(f){
		var _this = this === QClass ? null : this;
		var defer = QClass.defer();
		var argsArray = arg2arr(arguments,1)
		argsArray.push(cbAdapter(defer))
		f.apply(_this,argsArray)
		return defer.promise;
	}


	if(asbind("nfcall")){
		QClass.nfcall = nfcall;
	}

	if(asbind("nfapply")){
		QClass.nfapply = function(f,args){
			var _this = this === QClass ? null : this;
			var defer = QClass.defer();
			if(isArray(args)){
				args.push(cbAdapter(defer));
				f.apply(_this,args)
			}else{
				throw TypeError('"args" is not Array')
			}
			return defer.promise;
		}
	}

	QClass.denodeify = function(f){
		var _this = this === QClass ? null : this;
		return function(){
			return nfcall.apply(_this,[].concat([f],arg2arr(arguments)))
		}
	}
	return QClass;
}
module.exports = extendClass;
},{"./utils":3}],3:[function(require,module,exports){
'use strict';
exports.isPlainObject = function(obj) {
	if (obj === null || typeof(obj) !== "object" || obj.nodeType || (obj === obj.window)) {
		return false;
	}
	if (obj.constructor && !Object.prototype.hasOwnProperty.call(obj.constructor.prototype, "isPrototypeOf")) {
		return false;
	}
	return true;
}

exports.isArray = function(obj){
	return Object.prototype.toString.call(obj) == "[object Array]"
}

exports.isFunction = function(obj){
	return typeof obj == "function"
}

exports.isEmpty = function(obj){
	return typeof obj == 'undefined' || obj === null;
}

exports.arg2arr = function(arg,b,s){
	return Array.prototype.slice.call(arg,b,s);
}
},{}],4:[function(require,module,exports){
"use strict";
var epc = require("extend-promise/src/extendClass");
var utils = require("./utils");

function use(Promise){
	var _Promise;
	setPromise(Promise);
	var ONERROR = function(err){
		try{
			console.error(err);
		}catch(e){}
	};

	function setPromise(Promise){
		_Promise = Queue.Q = Queue.Promise = epc(Promise,{});
	};

	function maxFormat(max){
		var _max = (+max)>>0;
		if(_max > 0){
			return _max;
		}else{
			throw new Error('The "max" value is invalid')
		}
	}

	function toPromise(fn){
		try{
			return _Promise.resolve(fn());
		}catch(e){
			return _Promise.reject(e);
		}
	}
	
	/**
	 * 队列类
	 * @param {Number} max 队列最大并行数
	 * @param {Number} options 队列其他配置
	 */
	function Queue(max,options) {
		var self = this;
		// var def = {
		// 	"event_queue_begin":null    //队列开始
		// 	,"event_queue_end":null     //队列完成
		// 	,"event_queue_add":null     //有执行项添加进执行单元后执行
		// 	,"event_item_resolve":null  //成功
		// 	,"event_item_reject":null   //失败
		// 	,"event_item_finally":null  //一个执行单元结束后
		// 	,"retry":0                  //执行单元出错重试次数
		// 	,"retry_type":0             //重试模式 0/false:搁置执行(插入队列尾部重试),1/true:优先执行 (插入队列头部重试)
		// 	,"timeout":0                //执行单元超时时间(毫秒)
		// }

		var def = {
			"queueStart"  : null    //队列开始
			,"queueEnd"   : null     //队列完成
			,"workAdd"    : null     //有执行项添加进执行单元后执行
			,"workResolve": null  //成功
			,"workReject" : null   //失败
			,"workFinally": null  //一个执行单元结束后
			,"retry"      : 0                  //执行单元出错重试次数
			,"retryIsJump": false        //重试模式 false:搁置执行(插入队列尾部重试),true:优先执行 (插入队列头部重试)
			,"timeout"    : 0                //执行单元超时时间(毫秒)
		}

		var _queue = [];
		var _max = maxFormat(max);
		var _runCount = 0;
		var _isStart = false;
		var _isStop = 0;
		this._options = def
		this.onError = ONERROR;

		if(utils.isObject(options)){
			for(var i in options){
				if(def.hasOwnProperty(i)) def[i] = options[i]
			}
		}

		//最大并行数
		this.getMax = function(){
			return _max;
		}
		this.setMax = function(max){
			try{
				_max = maxFormat(max);
				if(!_isStop && _runCount) self.start();
			}catch(e){
				onError.call(self,e)
			}
		}
		//正在排队的项数
		this.getLength = function(){
			return _queue.length;
		}
		//正在运行的项数
		this.getRunCount = function(){
			return _runCount;
		}
		//队列是否已开始运行
		this.isStart = function(){
			return !!_isStart;
		}

		/**
		 * 向队列插入执行单元
		 * @param {queueUnit} unit 执行单元对像
		 * @param {bool} stack  是否以栈模式(后进先出)插入
		 * @param {bool} start  是否启动队列
		 * @param {bool} noAdd  是否调用队列workAdd方法 (重试模式不调用需要)
		 */
		this._addItem = function(unit,stack,start,noAdd){
			if(!(unit instanceof QueueUnit)) throw new TypeError('"unit" is not QueueUnit')
			if(stack){
				_queue.unshift(unit);
			}else{
				_queue.push(unit);
			}
			noAdd || runAddEvent.call(self,unit);
			if(start){
				self.start();
			}else{
				_isStart && queueRun();
			}
		}
		
		//执行下一项
		function next(){
			if(_runCount < _max && !_isStop && _queue.length > 0){
				var unit = _queue.shift()
				//if(unit){
					var xc_timeout
						,_mark=0
					var timeout = +getOption('timeout',unit,self)
						,retryNo = getOption('retry',unit,self)
						,retryType = getOption('retryIsJump',unit,self)
						,_self = unit._options.self
					var fix = function(){
						if(xc_timeout) clearTimeout(xc_timeout)
						xc_timeout = 0;
						if(_mark++) return true;
						_runCount--;
					}



					var afinally = function(){
						autoRun(unit,self,'workFinally',self,self,unit)
						// if(runEvent.call(unit,'workFinally',self,self,unit) !== false){
						// 	onoff && runEvent.call(self,'workFinally',self,self,unit);
						// }
					}

					var issucc = function(data){
						if(fix()) return;
						unit.defer.resolve(data);  //通知执行单元,成功
						autoRun(unit,self,'workResolve',self,data,self,unit)
						// if(runEvent.call(unit,'workResolve',self,data,self,unit) !== false){
						// 	onoff && runEvent.call(self,'workResolve',self,data,self,unit);
						// }
						afinally();
					}

					var iserr = function(err){
						if(fix()) return;
						if(retryNo > unit._errNo++){
							self._addItem(unit,retryType,true,false)
						}else{
							unit.defer.reject(err);  //通知执行单元,失败
							autoRun(unit,self,'workReject',self,err,self,unit)
							// if(runEvent.call(unit,'workReject',self,err,self,unit) !== false){
							// 	onoff && runEvent.call(self,'workReject',self,err,self,unit);
							// }
						}
						afinally();			
					};

					//队列开始执行事件
					if(_runCount == 0 && !_isStart){
						_isStart = true;
						runEvent.call(self,'queueStart',self,self);
					}

					var nextp = toPromise(function(){
						return unit.fn.apply((_self || null),unit.regs)
					}).then(issucc,iserr).then(function(){
						if(_queue.length>0){
							queueRun();
						}else if(_runCount == 0 && _isStart){//队列结束执行事件
							_isStart = false;
							runEvent.call(self,'queueEnd',self,self);
						}
					});
					_runCount += 1;
					//nextp.then(defer.resolve,defer.reject)
					if(timeout > 0){
						xc_timeout = setTimeout(function(){
							iserr("timeout")
						},timeout)
					}
					//return;
				//}
				return;
			}
			return true;
		}

		function queueRun(){
			while(!next()){}
			// if(_isStop) return;
			// do{
			// 	next();
			// }while(_queue.length && _runCount < _max)
		}
		/**队列控制**/
		
		//开始执行队列
		this.start = function(){
			_isStop = 0;
			queueRun();
		}

		this.stop = function(){
			//console.log('on stop')
			_isStop = 1;
		}
		
		//清空执行队列
		this.clear = function(err){
			while(_queue.length){
				var unit = _queue.shift();
				unit.defer.reject(err);
			}
		}
	}

	/**
	 * 队列执行单类
	 * @param {Function} fn  运行函数
	 * @param {Array}    args 元行函数的参数,可省略
	 * @param {Object}   options 其他配置
	 */
	function QueueUnit(fn, args, options){
		var def = {
			'workResolve' : true
			,'workReject' : true
			,'workFinally' : true
			,'queueEventTrigger' : true
			,'regs':[]
			,'self':null
		}
		var oNames = [
			'workResolve'    //是否执行队列workResolve事件
			,'workReject'    //是否执行队列workReject事件
			,'workFinally'   //是否执行队列workFinally事件
			,'queueEventTrigger'    //队列事件开关
			,'retry'                //重试次数
			,'retryIsJump'           //重试模式
			,'timeout'              //超时
			,'self'                 //运行函数self
		];
		var oi = 1;
		if(!utils.isFunction(fn)){
			throw new TypeError("Queues only support function, '" + fn + "' is not function")
		}
		this.fn = fn;
		this._errNo = 0;
		this.defer = _Promise.defer();
		if(utils.isArray(args)){
			this.regs = args;
			oi++;
		}

		function inOptions(name){
			for(var i = 0; i<oNames.length; i++){
				if(name === oNames[i]) return true;
			}
			return false;
		}

		this._options = def;
		var configObj = arguments[oi];
		//console.log(configObj);
		if(utils.isObject(configObj)){
			for(var i in configObj){
				if(inOptions(i)){
					def[i] = configObj[i];
				}
			}
		}
	}

	function getOption(name,qobj,queue){
		if(name in qobj._options){
			return qobj._options[name];
		}else{
			return queue._options[name];
		}
	}

	function runEvent(eventName,self){
		var event = this._options[eventName]
			,arg = utils.arg2arr(arguments,2);
		if(utils.isFunction(event)){
			try{
				return event.apply(self,arg)
			}catch(e){
				onError.call(self,e);
			}
		}else{
			return !!event;
		}
	}

	function autoRun(unit,queue){
		var onoff = unit._options.queueEventTrigger;
		var args = utils.arg2arr(arguments,2);
		if(runEvent.apply(unit,args) !== false){
			onoff && runEvent.apply(queue,args);
		}
	}

	function runAddEvent(unit){
		runEvent.call(this,'workAdd',this,unit,this);
	}

	//构建执行单元对象
	function getQueueUnit(fn,args,options){
		// try{
			return new QueueUnit(fn,args,options);
		// }catch(e){
		// 	if(utils.isFunction(this.onError)){
		// 		this.onError(e)
		// 	}
		// }
	}

	function onError(err){
		if(utils.isFunction(this.onError)){
			this.onError.call(this,err)
		}
	}

	function getAddArgs(data,fn,con,each){
		var isArray = utils.isArray(data);
		var rdata  = isArray ? [] : {};
		function fill(k){
			var args = each ? [].concat([data[k]],[k],[data]) : [].concat(data[k]);
			rdata[k] = [fn,args,con];
		}
		if(isArray){
			for(var i=0; i<data.length; i++){
				fill(i);
			}
		}else{
			for(var k in data){
				fill(k);
			}
		}
		return rdata;
	}

	function getBatchArgs(array,fn,con){
		var baseN = 2,_con,start,jump;
		if(utils.isObject(con)){
			_con = con;
			baseN++;
		}
		return {
			con : _con,
			start : arguments[baseN],
			jump : arguments[++baseN]
		}
	}

	function AddBatch(data,fn){
		var queue = this.queue
			,map = this.map
			,each = this.each
		var addArgs;
		var args = getBatchArgs.apply(null,arguments)
		addArgs = getAddArgs(data,fn,args.con,each)
		if(map){
			return queue.addProps(addArgs,args.start,args.jump);
		}else{
			return queue.addArray(addArgs,args.start,args.jump);
		}
	}

	Queue.prototype = {
		//获取/设置配置
		option: function(name){
			if(arguments.length == 1){
				return this._options[name];
			}else if(arguments.length > 1){
				this._options[name] = arguments[1]
			}
		}
		
		//向队列尾部增加执行项,若队列未启动，暂时不会被执行
		,'push' : function(){ 
			var o = this , unit = getQueueUnit.apply(o,arguments);
			o._addItem(unit,false);
			return unit.defer.promise;
		}
		//向队列头部增加执行项,若队列未启动，暂时不会被执行
		,'unshift': function(){
			var o = this , unit = getQueueUnit.apply(o,arguments);
			o._addItem(unit,true);
			return unit.defer.promise;
		}
		//添加执行项，并会启动队列
		,go: function(){
			var o = this , unit = getQueueUnit.apply(o,arguments);
			o._addItem(unit,false,true);
			return unit.defer.promise;
		}
		//在队列头部插入并执行项
		,jump: function(){
			var o = this , unit = getQueueUnit.apply(o,arguments);
			o._addItem(unit,true,true);
			return unit.defer.promise;
		}
		,add: function(fn,options){//fn,*options*,*start*,*jump*
			var o = this, _fun, _i = 1, unitArgs, start, jump, promise;
			if(!utils.isFunction(fn)) throw new TypeError("Queues only support function, '" + fn + "' is not function")
			_fun = function(){
				var defer = _Promise.defer();
				fn(defer.resolve,defer.reject);
				return defer.promise
			}
			unitArgs = [_fun]
			if(utils.isObject(options)){
				unitArgs.push(options);
				_i++;
			}
			start = !!arguments[_i]
			jump = !!arguments[_i+1];
			promise = jump ? o.unshift.apply(o,unitArgs) : o.push.apply(o,unitArgs);
			if(start) o.start();
			return promise;
		}
		,addArray: function(array,start,jump){
			var parrs = [];
			var o = this;
			for(var i = 0;i<array.length;i++){
				+function(){
					var _i = i;
					var unitArgs = array[_i];
					var _p = jump ? o.unshift.apply(o,unitArgs) : o.push.apply(o,unitArgs);
					parrs.push(_p);
				}()
			}
			var nextP = _Promise.defer();
			_Promise.all(parrs).then(function(data){nextP.resolve(data)},function(err){nextP.reject(err)})
			if(start) o.start();
			return nextP.promise;
		}
		,addProps: function(props,start,jump){
			var parrs = {};
			var o = this;
			for(var k in props){
				+function(){
					var _k = k;
					var unitArgs = props[_k];
					var _p = jump ? o.unshift.apply(o,unitArgs) : o.push.apply(o,unitArgs);
					parrs[_k] = _p;
				}()
			}
			var nextP = _Promise.defer();
			_Promise.allMap(parrs).then(function(data){nextP.resolve(data)},function(err){nextP.reject(err)})
			if(start) o.start();
			return nextP.promise;
		}
		,addLikeArray: function(array,fn,con){
			return AddBatch.apply({queue:this},arguments);
		}
		,addLikeProps: function(props,fn,con){
			return AddBatch.apply({queue:this,map:true},arguments);
		}
		,addLikeArrayEach: function(array,fn,con){
			return AddBatch.apply({queue:this,each:true},arguments);
		}
		,addLikePropsEach: function(array,fn,con){
			return AddBatch.apply({queue:this,each:true,map:true},arguments);
		}
	};

	Queue.use = setPromise;
	Queue.createUse = use;
	return Queue;
};

module.exports = use;
},{"./utils":5,"extend-promise/src/extendClass":2}],5:[function(require,module,exports){
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
},{}]},{},[1])