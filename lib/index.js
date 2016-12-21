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