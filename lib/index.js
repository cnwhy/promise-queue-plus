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
		_Promise = Queue.Q = epc(Promise,{});
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
		return _Promise.resolve(1).then(function(){
			return fn();
		});
	}

	/**
	 * 队列类
	 * @param {Number} max 队列最大并行数
	 * @param {Number} options 队列其他配置
	 */
	function Queue(max,options) {
		var self = this;
		var def = {
			"event_queue_begin":null    //队列开始
			,"event_queue_end":null     //队列完成
			,"event_queue_add":null     //有执行项添加进执行单元后执行
			,"event_item_resolve":null  //成功
			,"event_item_reject":null   //失败
			,"event_item_finally":null  //一个执行单元结束后
			,"retry":0                  //执行单元出错重试次数
			,"retry_type":0             //重试模式 0/false:搁置执行(插入队列尾部重试),1/true:优先执行 (插入队列头部重试)
			,"timeout":0                //执行单元超时时间(毫秒)
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
		this.getQueueLength = function(){
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
		 * @param {bool} noAdd  是否调用队列event_queue_add方法(重试模式需要)
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
					var onoff = unit._options.queue_event_onoff
						,timeout = +getOption('timeout',unit,self)
						,retryNo = getOption('retry',unit,self)
						,retryType = getOption('retry_type',unit,self)
						,_self = unit._options.self
					var fix = function(){
						if(xc_timeout) clearTimeout(xc_timeout)
						xc_timeout = 0;
						if(_mark++) return true;
						_runCount--;
					}

					var afinally = function(){
						if(runQueueUnitEvent.call(unit,'event_item_finally',self,self,unit) !== false){
							onoff && runQueueEvent.call(self,'event_item_finally',self,unit);
						}
					}

					var issucc = function(data){
						if(fix()) return;
						unit.defer.resolve(data);  //通知执行单元,成功
						if(runQueueUnitEvent.call(unit,'event_item_resolve',self,data,self,unit) !== false){
							onoff && runQueueEvent.call(self,'event_item_resolve',data,self,unit);
						}
						afinally();
					}

					var iserr = function(err){
						if(fix()) return;
						if(retryNo > unit._errNo++){
							self._addItem(unit,retryType,true,false)
						}else{
							unit.defer.reject(err);  //通知执行单元,失败
							if(runQueueUnitEvent.call(unit,'event_item_reject',self,err,self,unit) !== false){
								onoff && runQueueEvent.call(self,'event_item_reject',err,self,unit);
							}
						}
						afinally();			
					};

					//队列开始执行事件
					if(_runCount == 0 && !_isStart){
						_isStart = true;
						runQueueEvent.call(self,'event_queue_begin',self);
					}

					var nextp = toPromise(function(){
						return unit.fn.apply((_self || null),unit.regs)
					}).then(issucc,iserr).then(function(){
						if(_queue.length>0){
							queueRun();
						}else if(_runCount == 0 && _isStart){//队列结束执行事件
							_isStart = false;
							runQueueEvent.call(self,'event_queue_end',self);
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
			'event_item_resolve' : true
			,'event_item_reject' : true
			,'event_item_finally' : true
			,'queue_event_onoff' : true
			,'regs':[]
			,'self':null
		}
		var oNames = [
			'event_item_resolve'    //是否执行队列event_item_resolve事件
			,'event_item_reject'    //是否执行队列event_item_reject事件
			,'event_item_finally'   //是否执行队列event_item_finally事件
			,'queue_event_onoff'    //队列事件开关
			,'retry'                //重试次数
			,'retry_type'           //重试模式
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

	function runEvent(event,queue,arg){
		var o = queue;
		if(utils.isFunction(event)){
			try{
				return event.apply(o,arg)
			}catch(e){
				onError.call(o,e);
			}
		}else{
			return !!event;
		}
	}

	function runQueueEvent(eventName){
		var event = this._options[eventName]
			,arg = utils.arg2arr(arguments,1);
		return runEvent.call(null,event,this,arg);
	}
	function runQueueUnitEvent(eventName,queue){
		var event = this._options[eventName]
			,arg = utils.arg2arr(arguments,2);
		return runEvent.call(null,event,queue,arg);
	};
	function runAddEvent(aObbj){runQueueEvent.call(this,'event_queue_add',aObbj,this);}

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

		/*
		//插入一组
		addArray([
			[fn,args,con]
		]).then(function(array){
			console.log(array)
		})
		//插入prop 
		addProp({
			"a":[fn,args,con]
		}).then(function(json){
			console.log(json)
		})
		*/

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
			if(start) this.start();
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
			if(start) this.start();
			return nextP.promise;
		}
		,addLikeArray: function(array,fn,con){
			return AddBatch.apply({queue:this},arguments);
			// var addArgs;
			// var args = getBatchArgs.apply(null,arguments)
			// addArgs = getAddArgs(array,fn,args.con)
			// return this.addArray(addArgs,args.start,args.jump);
		}
		,addLikeProps: function(props,fn,con){
			return AddBatch.apply({queue:this,map:true},arguments);
			// var addArgs;
			// var args = getBatchArgs.apply(null,arguments)
			// addArgs = getAddArgs(props,fn,_con)
			// return this.addProps(addArgs,args.start,args.jump);
		}
		,addLikeArrayEach: function(array,fn,con){
			return AddBatch.apply({queue:this,each:true},arguments);
			// var addArgs;
			// var args = getBatchArgs.apply(null,arguments)
			// addArgs = getAddArgs(array,fn,_con,true)
			// return this.addArray(parrs,args.start,args.jump);
		}
		,addLikePropsEach: function(array,fn,con){
			return AddBatch.apply({queue:this,each:true,map:true},arguments);
			// var addArgs;
			// var args = getBatchArgs.apply(null,arguments)
			// addArgs = getAddArgs(props,fn,_con,true)
			// return this.addProps(addArgs,args.start,args.jump);
		}

		/*
		//插入一组相同过程对像,参数会被展开
		addLikeArray([value,value],function(value){}).then(function(array){})		
		addLikeProp({key:value},function(value){}).then(function(array){})
		
		//参数不会被展开
		addlikeArrayEach([value,value],function(value,key,map){})
		addlikePropEach({key:value},function(value,key,map){})
		*/
		//插入数组处理
/*		,all: function(arr,start,jump){
			var parrs = [];
			var o = this;
			for(var i = 0;i<arr.length;i++){
				+function(){
					var _i = i;
					var unitArgs = arr[_i];
					var _p = jump ? o.unshift.apply(o,unitArgs) : o.push.apply(o,unitArgs);
					parrs.push(_p);
				}()
			}
			var nextP = _Promise.defer();
			_Promise.all(parrs).then(function(data){nextP.resolve(data)},function(err){nextP.reject(err)})
			if(start) this.start();
			return nextP.promise;
		}
		,'allLike': function(arr,fn,con){
			var parrs = [],baseN = 2,config,start,jump;
			var o = this;
			if(utils.isObject(con)){
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
					var rges = [].concat([arr[_i]],[_i],[arr])
					var _p = jump ? o.unshift(fn,rges,con) : o.push(fn,rges,con);
					parrs.push(_p);
				}()
			}
			var nextP = _Promise.defer();
			_Promise.all(parrs).then(function(data){nextP.resolve(data)},function(err){nextP.reject(err)})
			if(start) this.start();
			return nextP.promise;
		}
		,'allEach': function(arr,fn,con){
			var parrs = [],baseN = 2,config,start,jump;
			var o = this;
			if(utils.isObject(con)){
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
					var rges = [].concat([arr[_i]],[_i],[arr])
					var _p = jump ? o.unshift(fn,rges,con) : o.push(fn,rges,con);
					parrs.push(_p);
				}()
			}
			var nextP = _Promise.defer();
			_Promise.all(parrs).then(function(data){nextP.resolve(data)},function(err){nextP.reject(err)})
			if(start) this.start();
			return nextP.promise;
		}
		,'allMap': function(map,fn,con){
			var parrs = {},baseN = 2,config,start,jump;
			var o = this;
			if(utils.isObject(con)){
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
					var rges = [].concat([map[_i]],[_i],[map])
					var _p = jump ? o.unshift(fn,rges,con) : o.push(fn,rges,con);
					parrs[_i] = _p;
				}()
			}
			var nextP = _Promise.defer();
			_Promise.allMap(parrs).then(function(data){nextP.resolve(data)},function(err){nextP.reject(err)})
			if(start) this.start();
			return nextP.promise;
		}*/
	};

	Queue.prototype.allArray = Queue.prototype.allLike

	Queue.use = setPromise;
	Queue.createUse = use;
	return Queue;
};
module.exports = use;