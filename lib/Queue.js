//适用于Promise的队列;
"use strict";
module.exports = function(Q){
	var _Promise;
	var _nQ = require("./q");
	var getPromise = function(){
		if(_Promise){
			return _Promise.defer ? _Promise.defer() : _Promise();
		}
	}
	if(Q && typeof Q == "function" && Q.defer){
		_Promise = Q;
	}else{
		_Promise = _nQ;
	}
	//console.log(_Promise);
	function Queueobj(fun){//执行单元对像
		var def = {
			'errNo':0
			,'Queue_event':1
			,'regs':[]
		}
		var events = ['event_succ','event_err','Queue_event'] //扩展预留
		this.fun = fun;
		for(var i in def){
			this[i] = def[i]
		}
		var regs = arguments[1];
		if(regs instanceof Array){
			this['regs'] = regs
		}
		var configObj = arguments[arguments.length-1]
		if(!!configObj && typeof configObj == "object" && !(configObj instanceof Array)){
			for(var i in events){
				var attname = events[i]
				if(typeof configObj[attname] != 'undefined'){
					this[attname] = configObj[attname]
				}
			}
		}
		this.defer = getPromise();
	}

	function Queue(max) {
		var def = {
			"event_succ":function(){}  //成功
			,"event_err":function(){}  //失败
			,"event_begin":function(){}  //队列开始
			,"event_end":function(){}    //队列完成
			,"event_add":function(){}    //有执行项添加进执行单元后执行
			,"retryNo":0				 //单元出错重试次数
			,"retryType":0               //重试模式  0:搁置执行(插入队列尾部重试),1:优先执行 (插入队列头部重试)
		}
		this.max = max;
		this.lins = [];
		this.ing = 0;
		this.isStart = 0;
		this.isStop = 0;
		this._option = def
		var max = max,lins = [],ing = 0,isStart = 0,isStop = 0,_option = def;
		if(typeof arguments[1] == 'function') this._option.event_succ = arguments[1];
		if(typeof arguments[2] == 'function') this._option.event_err = arguments[2];
		if(typeof arguments[3] == 'function') this._option.event_begin = arguments[3];
		if(typeof arguments[4] == 'function') this._option.event_end = arguments[4];
		var _option = arguments[arguments.length-1]
		if(typeof _option == "object"){
			for(var i in def){
				if(typeof _option[i] != 'undefined'){
					this._option[i] = _option[i]
				}
			}
		}
	};

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
			if(this.ing < this.max && !this.isStop){
				var _Obj = this.lins.shift()
				if(_Obj){
					var o = this;
					o.isStart || o._option.event_begin.call(this)
					o.isStart = 1;
					o.ing += 1;
					try{
						var nextp = _nQ.toPromis(function(){return _Obj.fun.apply(null,_Obj.regs)})	

					}catch(err){
						o.ing -= 1;
						if(_Obj.defer) _Obj.defer.reject(err);
						if(_Obj.event_err) _Obj.event_err.call(o,err,_Obj)
						if(_Obj.Queue_event) o._option.event_err.call(o,err,_Obj); //执行队列的失败事件
						o.isStop || o.start();
						return;
					}
					nextp.then(function(data){
					//_Obj.fun.apply(null,_Obj.regs).then(function(data){
						if(_Obj.defer) _Obj.defer.resolve(data);             //通知执行单元,成功
						if(_Obj.event_succ) _Obj.event_succ.call(o,data,_Obj) //执行单元的succ事件
						if(_Obj.Queue_event) o._option.event_succ.call(o,data,_Obj); //执行队列的succ事件
						o.ing -= 1;
						o.isStop || o.start();
					},function(err){
						o.ing -= 1;
						_Obj.errNo += 1;
						if(o._option.retryNo > _Obj.errNo-1){
							if(o._option.retryType) o.jump(_Obj)
							else o.push(_Obj);
							o.start();
						}else{
							if(_Obj.defer) _Obj.defer.reject(err);  //通知执行单元,失败
							if(_Obj.event_err) _Obj.event_err.call(o,err,_Obj)
							if(_Obj.Queue_event) o._option.event_err.call(o,err,_Obj); //执行队列的失败事件
							o.isStop || o.start();
						}
						
					})
				}else if(this.ing == 0 && this.isStart){
					this.isStart = 0;
					this._option.event_end && this._option.event_end.call(this);
				}
			}
		}
		//构建执行对象
		,toObj: function(fun,args,con){
			if(fun instanceof Queueobj){
				return fun;
			}else if(typeof fun == 'function'){
				return new Queueobj(fun,args,con)
			}else{
				throw new Error("Argument TypeError!") 
			}
		}
		//向队列尾部增加执行项,若队列未启动，暂时不会被执行
		,'push' : function(){ 
			var aObbj = this.toObj.apply(this,arguments)
			if(!aObbj) return;
			this.lins.push(aObbj)
			this._option.event_add.apply(this,aObbj);
			if(aObbj.defer) return aObbj.defer.promise;
		}
		//向队列头部增加执行项,若队列未启动，暂时不会被执行
		,'unshift': function(){
			var aObbj = this.toObj.apply(this,arguments)
			if(!aObbj) return;
			this.lins.unshift(aObbj)
			this._option.event_add.apply(this,aObbj);
			if(aObbj.defer) return aObbj.defer.promise;
		}
		//添加执行项，并会启动队列, 不会触发event_add
		,go: function(fun){
			var aObbj = this.toObj.apply(this,arguments)
			if(!aObbj) return;
			this.lins.push(aObbj)
			this._option.event_add.apply(this,aObbj);
			this.start();
			if(aObbj.defer) return aObbj.defer.promise;
		}
		//在队列头部插入并执行项
		,jump: function(fun){
			var aObbj = this.toObj.apply(this,arguments)
			if(!aObbj) return;
			this.lins.unshift(aObbj)
			this._option.event_add.apply(this,aObbj);
			this.start();
			if(aObbj.defer) return aObbj.defer.promise;
		}
		//插入数组处理
		//,'allLike': function(arr,fun,con,start,jump){
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
			var nextP = getPromise();
			_nQ.all(parrs).then(function(data){nextP.resolve(data)},function(err){nextP.reject(err)})
			if(start) this.start();
			return nextP.promise;
		}
		,'allLike': function(arr,fun,con){
			var parrs = [],baseN = 2,config,start,jump,con;
			var o = this;
			if(typeof con == "object"){
				config = con;
				baseN++;
			}else{
				con = null;
			}
			var start = arguments[baseN],jump = arguments[++baseN];
			for(var i=0;i<arr.length;i++){
				+function(){
					var _i = i;
					var rges = Array.prototype.concat.call([],arr[_i])
					var _p = jump ? o.unshift(fun,rges,con) : o.push(fun,rges,con);
					parrs.push(_p);
				}()
			}
			var nextP = getPromise();
			_nQ.all(parrs).then(function(data){nextP.resolve(data)},function(err){nextP.reject(err)})
			if(start) this.start();
			return nextP.promise;
		}
		,'allEach': function(arr,fun,con){
			var parrs = [],baseN = 2,config,start,jump,con;
			var o = this;
			if(typeof con == "object"){
				config = con;
				baseN++;
			}else{
				con = null;
			}
			var start = arguments[baseN],jump = arguments[++baseN];
			for(var i in arr){
				+function(){
					var _i = i;
					var rges = Array.prototype.concat.call([],arr[_i],_i,arr)
					var _p = jump ? o.unshift(fun,rges,con) : o.push(fun,rges,con);
					parrs.push(_p);
				}()
			}
			var nextP = getPromise();
			_nQ.all(parrs).then(function(data){nextP.resolve(data)},function(err){nextP.reject(err)})
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
		,setMax: function(max,a){ //修改执行单元并行数
			if(max <= 0) return;
			this.max = max;
			a || this.start();
		}
		//清空执行队列
		,'clear': function(err){
			this.stop();
			//console.log(this.lins);
			while(this.lins.length){
				var _Obj = this.lins.shift();
				_Obj.defer.reject(err)
			}
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