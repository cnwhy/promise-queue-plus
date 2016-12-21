/*!
 * queue-fun v1.0.0
 * Homepage https://github.com/cnwhy/queue-fun
 * License BSD
 */
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (name, factory) {
	if (typeof define === 'function' && (define.amd || define.cmd)) {
		define([], factory);
	} else if (typeof window !== "undefined" || typeof self !== "undefined") {
		var global = typeof window !== "undefined" ? window : self;
		global[name] = factory();
	} else {
		throw new Error("加载 " + name + " 模块失败！，请检查您的环境！")
	}
}('QueueFun', function () {
	return require('../lib/index.js')(require('easy-promise/setTimeout'));
}));
},{"../lib/index.js":2,"easy-promise/setTimeout":3}],2:[function(require,module,exports){
"use strict";
var epc = require("extend-promise/src/extendClass");
module.exports = function(Promise){	
	var _Promise;
	setPromise(Promise);
	var ONERROR = (function(){//兼容IE低版本浏览器
		if(typeof console == 'object' && typeof console.error == "function"){ 
			return function(err){
				console.error(err);
			}
		}
		return function(){};
	})();

	function setPromise(Promise){
		_Promise = Queue.Q = {};
		epc(Promise,_Promise);	
	};

	Queue.setPromise = setPromise;

	function Queue(max) {
		var def = {
			"event_succ":function(){}    //成功
			,"event_err":function(){}    //失败
			,"event_begin":function(){}  //队列开始
			,"event_end":function(){}    //队列完成
			,"event_add":function(){}    //有执行项添加进执行单元后执行
			,"retry":0				     //单元出错重试次数
			,"retry_type":0              //重试模式  0:搁置执行(插入队列尾部重试),1:优先执行 (插入队列头部重试)
			,"timeout":0
		}
		this.max = max;
		this.lins = [];
		this.ing = 0;
		this.isStart = 0;
		this.isStop = 0;
		this._option = def
		this.onError = ONERROR;
		var _option = arguments[arguments.length-1];
		if(typeof _option == "object"){
			for(var i in def){
				if(typeof _option[i] != 'undefined'){
					this._option[i] = _option[i]
				}
			}
		}
	}
	function toPromise(fun){
		return _Promise.resolve(1).then(function(){
			return fun();
		});
	}

	function Queueobj(args){
		var def = {
			'errNo':0
			,'run_queue_event':1
			,'regs':[]
		}
		var options = [
			'event_succ'
			,'event_err'
			,'retry'
			,'retry_type'
			,'run_queue_event'
			,'timeout'
			,'self'
		] //
		for(var i in def){
			this[i] = def[i]
		}
		this.fun = args[0];
		var regs = args[1];
		if(regs instanceof Array){
			this.regs = regs;
		}
		var configObj = args.length > 1 ? args[args.length-1] : false;
		if(!!configObj && typeof configObj == "object" && !(configObj instanceof Array)){
			for(i in options){
				var attname = options[i]
				if(typeof configObj[attname] != 'undefined'){
					this[attname] = configObj[attname]
				}
			}
		}
		this.defer = _Promise.defer();
	}

	function getOption(name,qobj,queue){
		var _vq = qobj[name];
		return typeof _vq !== "undefined" ? _vq : queue._option[name];
	}

	function runEvent(event,queue,arg){
		var o = queue;
		if(event && typeof event == "function"){
			try{
				event.apply(o,arg)
			}catch(e){
				if(typeof queue.onError == "function"){
					queue.onError(e)
				}
			}
		}
	}
	function runQueueEvent(eventName){
		var event = this._option[eventName]
			,arg = Array.prototype.slice.call(arguments,1);
		runEvent.call(null,event,this,arg);
	}
	function runQueueobjEvent(eventName,queue){
		var event = this[eventName]
			,arg = Array.prototype.slice.call(arguments,2);
		//console.log(this,eventName,queue)
		runEvent.call(null,event,queue,arg);
	};
	function runAddEvent(aObbj){runQueueEvent.call(this,'event_add',aObbj,this);}

	//构建执行对象
	function toObj(fun){
		if(fun instanceof Queueobj){
			return fun;
		}else if(typeof fun == 'function'){
			return new Queueobj(Array.prototype.slice.call(arguments))
		}else{
			throw new TypeError("Queues only support function, '" + fun + "' is not function")
		}
	}

	Queue.prototype = {
		//获取/设置配置
		option: function(name){
			if(arguments.length == 1){
				return this._option[name];
			}else if(arguments.length > 1){
				this._option[name] = arguments[1]
			}
		}
		//执行下一项
		,next : function(){
			var o = this;
			if(this.ing < this.max && !this.isStop){
				var _Obj = this.lins.shift()
				if(_Obj){
					var Qevent = _Obj.run_queue_event
					var xc_timeout
						,_mark=0
					var timeout = getOption('timeout',_Obj,o)
						,retryNo = getOption('retry',_Obj,o)
						,retryType = getOption('retry_type',_Obj,o)
					//	,_mark1;
					var fin = function(){
						if(xc_timeout) clearTimeout(xc_timeout)
						xc_timeout = 0;
						if(_mark++) return true;
						o.ing--;
					}
					var issucc = function(data){
						if(fin()) return;
						if(_Obj.defer) _Obj.defer.resolve(data);  //通知执行单元,成功
						runQueueobjEvent.call(_Obj,'event_succ',o,data,o,_Obj);
						Qevent && runQueueEvent.call(o,'event_succ',data,o,_Obj);
					}
					var iserr = function(err){
						//if(err == 'timeout') _mark1 =1;
						if(fin()) return;
						_Obj.errNo++;
						if(retryNo > _Obj.errNo-1){
							if(retryType) o.jump(_Obj)
							else o.go(_Obj);
						}else{
							if(_Obj.defer) _Obj.defer.reject(err);  //通知执行单元,失败
							runQueueobjEvent.call(_Obj,'event_err',o,err,o,_Obj);
							Qevent && runQueueEvent.call(o,'event_err',err,o,_Obj);
						}					
					};
					var nextp = toPromise(function(){
						return _Obj.fun.apply(_Obj.self || null,_Obj.regs)
					}).then(issucc,iserr).then(function(){
						o.isStop || o.start();
					});
					o.ing += 1;
					//nextp.then(defer.resolve,defer.reject)
					if(typeof _Obj.timeout !== "undefined" || o._option.timeout > 0){
						var timeout = o._option.timeout;
						timeout = typeof _Obj.timeout !== "undefined" ? +_Obj.timeout : timeout;
						if(timeout > 0){
							xc_timeout = setTimeout(function(){
								iserr("timeout")
							},timeout)
						}
					}
				}

				if(_Obj && !o.isStart){
					o.isStart = 1;
					runQueueEvent.call(o,'event_begin',o);
				}

				if(!_Obj && o.ing === 0 && o.isStart){
					o.isStart = 0;
					runQueueEvent.call(o,'event_end',o);
				}
			}
		}
		//向队列尾部增加执行项,若队列未启动，暂时不会被执行
		,'push' : function(){ 
			var o = this , aObbj = toObj.apply(0,arguments);
			o.lins.push(aObbj)
			runAddEvent.call(o,aObbj)
			return aObbj.defer.promise;
		}
		//向队列头部增加执行项,若队列未启动，暂时不会被执行
		,'unshift': function(){
			var o = this , aObbj = toObj.apply(0,arguments);
			o.lins.unshift(aObbj)
			runAddEvent.call(o,aObbj)
			return aObbj.defer.promise;
		}
		//添加执行项，并会启动队列
		,go: function(fun){
			var o = this , aObbj = toObj.apply(0,arguments);
			o.lins.push(aObbj)
			runAddEvent.call(o,aObbj)
			o.start();
			return aObbj.defer.promise;
		}
		//在队列头部插入并执行项
		,jump: function(fun){
			var o = this , aObbj = toObj.apply(0,arguments);
			o.lins.unshift(aObbj)
			runAddEvent.call(o,aObbj)
			o.start();
			return aObbj.defer.promise;
		}
		//插入数组处理
		,all: function(arr,start,jump){
			var parrs = [];
			var o = this;
			for(var i = 0;i<arr.length;i++){
				+function(){
					var _i = i;
					var funobj = arr[_i];
					var _p = jump ? o.unshift.apply(o,funobj) : o.push.apply(o,funobj);
					parrs.push(_p);
				}()
			}
			var nextP = _Promise.defer();
			_Promise.all(parrs).then(function(data){nextP.resolve(data)},function(err){nextP.reject(err)})
			if(start) this.start();
			return nextP.promise;
		}
		,'allLike': function(arr,fun,con){
			var parrs = [],baseN = 2,config,start,jump;
			var o = this;
			if(typeof con == "object"){
				config = con;
				baseN++;
			}else{
				con = null;
			}
			start = arguments[baseN];
			jump = arguments[++baseN];
			for(var i=0;i<arr.length;i++){
				+function(){
					var _i = i;
					var rges = Array.prototype.concat.call([],arr[_i])
					var _p = jump ? o.unshift(fun,rges,con) : o.push(fun,rges,con);
					parrs.push(_p);
				}()
			}
			var nextP = _Promise.defer();
			_Promise.all(parrs).then(function(data){nextP.resolve(data)},function(err){nextP.reject(err)})
			if(start) this.start();
			return nextP.promise;
		}
		,'allEach': function(arr,fun,con){
			var parrs = [],baseN = 2,config,start,jump;
			var o = this;
			if(typeof con == "object"){
				config = con;
				baseN++;
			}else{
				con = null;
			}
			start = arguments[baseN];
			jump = arguments[++baseN];
			for(var i in arr){
				+function(){
					var _i = i;
					var rges = Array.prototype.concat.call([],arr[_i],_i,arr)
					var _p = jump ? o.unshift(fun,rges,con) : o.push(fun,rges,con);
					parrs.push(_p);
				}()
			}
			var nextP = _Promise.defer();
			_Promise.all(parrs).then(function(data){nextP.resolve(data)},function(err){nextP.reject(err)})
			if(start) this.start();
			return nextP.promise;
		}
		,'allMap': function(map,fun,con){
			var parrs = {},baseN = 2,config,start,jump;
			var o = this;
			if(typeof con == "object"){
				config = con;
				baseN++;
			}else{
				con = null;
			}
			start = arguments[baseN];
			jump = arguments[++baseN];
			for(var i in map){
				+function(){
					var _i = i;
					var rges = Array.prototype.concat.call([],map[_i],_i,map)
					var _p = jump ? o.unshift(fun,rges,con) : o.push(fun,rges,con);
					parrs[_i] = _p;
				}()
			}
			var nextP = _Promise.defer();
			_Promise.allMap(parrs).then(function(data){nextP.resolve(data)},function(err){nextP.reject(err)})
			if(start) this.start();
			return nextP.promise;
		}

		/**队列控制**/
		
		//开始执行队列
		,start: function(){
			this.isStop = 0;
			do{
				this.next();
			}while(this.lins.length && this.ing < this.max)
		}
		,stop: function(){
			//console.log('on stop')
			this.isStop = 1;
		}
		//修改并行单元数
		,setMax: function(max){ //修改执行单元并行数
			try{
				max = (+max)>>0;
				if(max > 0){
					this.max = max;
					if(!this.isStop && this.ing) this.start();
				}else{
					throw new Error('The "max" value is invalid')
				}
			}catch(e){
				if(typeof this.onError == "function"){
					this.onError(e)
				}
			}
		}
		//清空执行队列
		,'clear': function(err){
			//this.stop();
			//console.log(this.lins);
			while(this.lins.length){
				var _Obj = this.lins.shift();
				_Obj.defer.reject(err)
			}
			//运行装态下执行clear将触发 eve
			// if(!this.isStop){

			// }
		}
		/**事件**/
		// //有执行项添加进执行单元后执行
		// ,event_add: function(){}
		// //执行单元成功后
		// ,event_succ: function(data){}
		// //执行单元失败
		// ,event_err: function(err,obj){}
		// //队列开始执行
		// ,event_begin: function(){}
		// //队列运行结束执行
		// ,event_end: function(){}
	};
	Queue.prototype.allArray = Queue.prototype.allLike
	
	return Queue;
};
},{"extend-promise/src/extendClass":5}],3:[function(require,module,exports){
module.exports = require("./src")(function(fn){setTimeout(fn,0)});
},{"./src":4}],4:[function(require,module,exports){
"use strict";
module.exports = function(nextTick){
	var FUN = function(){};
	function Resolve(promise, x) {
		if(isPromise(x)){
			x.then(promise.resolve,promise.reject)
		}else if (x && (typeof x === 'function' || typeof x === 'object')) {
			var called = false,then;
			try {
				then = x.then;
				if (typeof then === 'function') {
					then.call(x, function(y) {
						if (called) return;
						called = true;
						Resolve(promise, y);
					}, function(r) {
						if (called) return;
						called = true;
						promise.reject(r);
					});
				}else {
					promise.resolve(x);
				}
			}catch (e) {
				if (!called) {
					called = true;
					promise.reject(e);
				}
			}
		}else {
			promise.resolve(x);
		}
	}

	function isPromise(obj){
		return obj instanceof Promise_;
	}

	function bind(fun,self){
		var arg = Array.prototype.slice.call(arguments,2);
		return function(){
			fun.apply(self,arg.concat(Array.prototype.slice.call(arguments)));
		}
	}

	function Promise_(fun){
		//var defer = this.defer = new Defer(this);
		var self = this;
		this.status = -1;  //pending:-1 ; fulfilled:1 ; rejected:0
		this._events = [];
		var lock = false;

		function _resolve(value){
			changeStatus.call(self,1,value)
		}
		function _reject(reason){
			changeStatus.call(self,0,reason)
		}

		function resolve(value){
			if(lock) return;
			lock = true;
			if(self === value){
				return _reject(new TypeError("The promise and its value refer to the same object"));
			} 
			Resolve({resolve:_resolve,reject:_reject},value)
		}
		function reject(reason){
			if(lock) return;
			lock = true;
			_reject(reason);
		}

		this.resolve = resolve;
		this.reject = reject;
		
		if(fun !== FUN && typeof fun == "function"){
			try{
				fun(this.resolve,this.reject);
			}catch(e){
				this.reject(e)
			}
		}
	}

	Promise_.defer = function(){
		var _promise = new Promise_(FUN);
		return {
			promise: _promise,
			resolve: _promise.resolve,
			reject: _promise.reject
		}
	}

	Promise_.resolve = function(obj){
		if(isPromise(obj)) return obj;
		return new Promise_(function(ok,no){
			ok(obj);
		})
	}

	Promise_.reject = function(err){
		return new Promise_(function(ok,no){
			no(err);
		})
	}

	Promise.prototype.toString = function () {
	    return "[object Promise]";
	}

	Promise_.prototype.then = function(ok,no){
		var status = this.status;
		var defer = Promise_.defer()
			,promise = defer.promise
			
		if(!~status){
			this._events.push([ok,no,promise]);
		}else if(status && typeof ok == "function"){
			runThen(ok,this.value,promise,status);
		}else if(!status && typeof no == "function"){
			runThen(no,this.reason,promise,status)
		}else{
			if(status) defer.resolve(this.value)
			else defer.reject(this.reason);
		}

		// this._events.push([ok,no,promise]);
		// runThens.call(this)
		return promise;
	}

	function changeStatus(status,arg){
		var self = this;
		if(~this.status) return;
		this.status = status;
		if(status){
			this.value = arg
		}else{
			this.reason = arg;
		}
		runThens.call(self)
	}

	function runThens(){
		if(!~this.status) return;
		var self = this
			,_event = self._events
			,arg = self.status ? self.value : self.reason
			,FnNumb = self.status ? 0 : 1;
		//while(_event.length){
		for(var i=0; i<_event.length; i++){
			(function(eArr){
				var resolve,reject
				var fn = eArr[FnNumb]
					,nextQ = eArr[2]
				runThen(fn,arg,nextQ,self.status);
			})(_event[i])
			// })(_event.shift())
		}
		_event = [];
	}

	function runThen(fn,arg,nextQ,status){
		var resolve = nextQ.resolve
			,reject = nextQ.reject
		// if(nextQ){
		// 	resolve = nextQ.resolve
		// 	reject = nextQ.reject 
		// }
		if(typeof fn == 'function'){
			nextTick(function(){
				var nextPromise;
				try{
					nextPromise = fn(arg)
				}catch(e){
					reject(e)
					// if(reject) 
					// else throw e;
					return;
				}
				resolve(nextPromise);
			})
		}else{
			if (status) resolve(arg)
			else reject(arg)
		}
	}
	return Promise_;
}
},{}],5:[function(require,module,exports){
function isPlainObject(obj) {
	if (obj === null || typeof(obj) !== "object" || obj.nodeType || (obj === obj.window)) {
		return false;
	}
	if (obj.constructor && !Object.prototype.hasOwnProperty.call(obj.constructor.prototype, "isPrototypeOf")) {
		return false;
	}
	return true;
}
function extendClass(Promise,obj,funnames){
	var QClass,source;
	if(obj){
		source = true
		QClass = obj;
	}else{
		QClass = Promise;
	}

	function asbind(name){
		if(Object.prototype.toString(funnames) == "[Objece Array]"){
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
			return typeof QClass[name] !== 'function';
		}
		return true;
	}

	if(!QClass.Promise && Promise != obj) QClass.Promise = Promise;

	//defer
	if(typeof Promise.defer == "function"){
		QClass.defer = Promise.defer
	}else if(typeof Promise.deferred == "function"){
		QClass.defer = Promise.deferred
	}else{
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
	}

	//delay
	if(asbind("delay")){
		QClass.delay = function(ms,value){
			var defer = QClass.defer();
			setTimeout(defer.resolve,ms,value)
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
		if(typeof count != 'undefined' && count != null){
			count = +count > 0 ? +count : 0; 
		}
		return function(promises) {
			var defer = QClass.defer();
			var data,_tempI = 0;
			var fillData = function(i){
				var _p = promises[i]
				QClass.resolve(_p).then(function(d) {
					data[i] = d;
					if (--_tempI == 0 || (!map && count && data.length>=count)) {
						defer.resolve(data);
					}
				}, function(err) {
					if (typeof count == "undefined") {
						defer.reject(err);
					}else if(--_tempI == 0){
						defer.resolve(data);
					}
				})
				_tempI++;
			}
			if(Object.prototype.toString.call(promises) === '[object Array]'){
				data = [];
				for(var i = 0; i<promises.length; i++){
					fillData(i);
				}
			}else if(map && isPlainObject(promises)){
				data = {}
				for(var i in promises){
					fillData(i);
				}
			}else{
				defer.reject(new TypeError());
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
			return getall(false,count||0)(proArr)
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
			+ function() {
				var _i = i;
				//nextTick(function() {
					var _p = proArr[_i];
					QClass.resolve(_p).then(function(data) {
						defer.resolve(data);
					}, function(err) {
						defer.reject(err);
					})
				//}, 0)
			}()
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
		var argsArray = Array.prototype.slice.call(arguments,1)
		argsArray.push(cbAdapter(defer))
		f.apply(_this,argsArray)
	}


	if(asbind("nfcall")){
		QClass.nfcall = nfcall;
	}

	if(asbind("nfapply")){
		QClass.nfapply = function(f,args){
			var _this = this === QClass ? null : this;
			var defer = QClass.defer();
			if(Object.prototype.toString.call(args) === '[object Array]'){
				args.push(cbAdapter(defer));
				f.apply(_this,args)
			}else{
				throw "args TypeError"
			}
			return defer.promise;
		}
	}

	QClass.denodeify = function(f){
		var _this = this === QClass ? null : this;
		return function(){
			return nfcall.call(_this,f,Array.prototype.slice.call(arguments))
		}
	}
	return QClass;
}
module.exports = extendClass;
},{}]},{},[1])