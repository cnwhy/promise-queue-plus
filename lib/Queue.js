//适用于Promise的队列;
var nextTick = (typeof process == 'object' && process.nextTick) ? process.nextTick : setTimeout;
module.exports = function(Q){
	"use strict";
	var _Promise;
	var _nQ = require("./Q");
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
	//执行单元对像
	function Queueobj(args){
		var def = {
			'errNo':0
			,'Queue_event':1
			,'regs':[]
		}
		var events = ['event_succ','event_err','Queue_event','timeout'] //扩展预留
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
			for(i in events){
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
			,"timeout":0
		}
		this.max = max;
		this.lins = [];
		this.ing = 0;
		this.isStart = 0;
		this.isStop = 0;
		this._option = def
		var _option = arguments[arguments.length-1];
		if(typeof arguments[1] == 'function') this._option.event_succ = arguments[1];
		if(typeof arguments[2] == 'function') this._option.event_err = arguments[2];
		if(typeof arguments[3] == 'function') this._option.event_begin = arguments[3];
		if(typeof arguments[4] == 'function') this._option.event_end = arguments[4];
		if(typeof _option == "object"){
			for(var i in def){
				if(typeof _option[i] != 'undefined'){
					this._option[i] = _option[i]
				}
			}
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
			if(this.ing < this.max && !this.isStop){
				var _Obj = this.lins.shift()
				var o = this;
				if(_Obj){
					var xc_t,_mark=0,_mark1;
					var nextp;
					o.isStart || nextTick(function(){ _nQ.toPromis(function(){o._option.event_begin.call(o)}); });
					o.isStart = 1;
					o.ing += 1;
					nextp = _nQ.toPromis(function(){return _Obj.fun.apply(null,_Obj.regs)})	
					var fin = function(){
						if(xc_t) clearTimeout(xc_t)
						xc_t = 0;
						if(_mark++) return true;
						o.ing--;
					}
					var issucc = function(data){
						//console.log(111)
						//o.ing --;
						if(fin()) return;
						if(_Obj.defer) _Obj.defer.resolve(data);             //通知执行单元,成功
						nextTick(function(){
							if(_Obj.event_succ) _nQ.toPromis(function(){_Obj.event_succ.call(o,data,_Obj)}) //执行单元的succ事件
						},0)
						nextTick(function(){
							if(_Obj.Queue_event) _nQ.toPromis(function(){o._option.event_succ.call(o,data,_Obj)}); //执行队列的succ事件
						},0)
						o.isStop || o.start();
						//fin();
					}
					var iserr = function(err){
						if(err == 'timeout') _mark1 =1;
						//o.ing--;
						if(fin()) return;
						_Obj.errNo++;
						if(o._option.retryNo > _Obj.errNo-1){
							if(o._option.retryType) o.jump(_Obj)
							else o.push(_Obj);
							o.isStop || o.start();
						}else{
							if(_Obj.defer) _Obj.defer.reject(err);  //通知执行单元,失败
							nextTick(function(){
								if(_Obj.event_err) _nQ.toPromis(function(){_Obj.event_err.call(o,err,_Obj)})
							},0)
							nextTick(function(){
								if(_Obj.Queue_event) _nQ.toPromis(function(){o._option.event_err.call(o,err,_Obj)}); //执行队列的失败事件
							},0)
							o.isStop || o.start();
						}					
					}
					nextp.then(issucc,iserr)
					if(typeof _Obj.timeout !== "undefined" || o._option.timeout > 0){
						var timeout = o._option.timeout;
						timeout = typeof _Obj.timeout !== "undefined" ? +_Obj.timeout : timeout;
						if(timeout > 0){
							xc_t = setTimeout(function(){
								iserr("timeout")
							},timeout)
						}
					}
				}else if(o.ing === 0 && o.isStart){
					o.isStart = 0;
					nextTick(function(){
						_nQ.toPromis(function(){o._option.event_end.call(o)});
					},0)
				}
			}
		}
		//构建执行对象
		,toObj: function(fun){
			if(fun instanceof Queueobj){
				return fun;
			}else if(typeof fun == 'function'){
				return new Queueobj(Array.prototype.slice.call(arguments))
			}else{
				throw new Error("Argument TypeError!") 
			}
		}
		//向队列尾部增加执行项,若队列未启动，暂时不会被执行
		,'push' : function(){ 
			var o = this , aObbj = o.toObj.apply(o,arguments);
			o.lins.push(aObbj)
			_nQ.toPromis(function(){o._option.event_add.apply(o,aObbj)});
			return aObbj.defer.promise;
		}
		//向队列头部增加执行项,若队列未启动，暂时不会被执行
		,'unshift': function(){
			var o = this , aObbj = o.toObj.apply(o,arguments);
			o.lins.unshift(aObbj)
			_nQ.toPromis(function(){o._option.event_add.apply(o,aObbj)});
			return aObbj.defer.promise;
		}
		//添加执行项，并会启动队列, 不会触发event_add
		,go: function(fun){
			var o = this , aObbj = o.toObj.apply(o,arguments);
			o.lins.push(aObbj)
			_nQ.toPromis(function(){o._option.event_add.apply(o,aObbj)});
			o.start();
			return aObbj.defer.promise;
		}
		//在队列头部插入并执行项
		,jump: function(fun){
			var o = this , aObbj = o.toObj.apply(o,arguments);
			o.lins.unshift(aObbj)
			_nQ.toPromis(function(){o._option.event_add.apply(o,aObbj)});
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
			var nextP = getPromise();
			_nQ.all(parrs).then(function(data){nextP.resolve(data)},function(err){nextP.reject(err)})
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
			var nextP = getPromise();
			_nQ.all(parrs).then(function(data){nextP.resolve(data)},function(err){nextP.reject(err)})
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
			var nextP = getPromise();
			_nQ.all(parrs).then(function(data){nextP.resolve(data)},function(err){nextP.reject(err)})
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
			var nextP = getPromise();
			_nQ.allMap(parrs).then(function(data){nextP.resolve(data)},function(err){nextP.reject(err)})
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