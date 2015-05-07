//适用于Q 等 Promise 模式 的队列;
"use strict";
module.exports = function(Q){
	var Promise;
	if(Q){
		var v_typeof = typeof Q;
		//console.log(v_typeof);
		if(v_typeof == "function"){
			Promise = Q;
		}else if(v_typeof == 'object' && Q.defer){
			Promise = Q;
		}else{
			Promise = require("./q");
		}
		//console.log(v_typeof,Promise);
	}
	
	
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
		if(typeof configObj == "object" && !(configObj instanceof Array)){
			for(var i in events){
				var attname = events[i]
				if(typeof configObj[attname] != 'undefined'){
					this[attname] = configObj[attname]
				}
			}
		}
		if(Promise){
			this.defer = Promise.defer ? Promise.defer() : Promise();
		}
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
		this.ing = 0;
		this.lins = [];
		this.isStart = 0;
		this.isStop = 0;
		this._option = def
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
		//执行下一项
		next : function(){
			if(this.ing < this.max){
				var _Obj = this.lins.shift()
				if(_Obj && !this.isStop){
					var o = this;
					o.isStart || o._option.event_begin.call(this)
					o.isStart = 1;
					o.ing += 1;
					_Obj.fun.apply(null,_Obj.regs).then(function(data){
						if(_Obj.defer) _Obj.defer.resolve(data);             //通知执行单元,成功
						if(_Obj.event_succ) _Obj.event_succ.call(o,data,_Obj)
						if(_Obj.Queue_event) o._option.event_succ.call(o,data,_Obj); //执行队列的成功事件
						o.ing -= 1;
						o.start();
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
							o.start();
						}
						
					})
				}else if(this.ing == 0 && !this.isStop){
					this.isStart = 0;
					this._option.event_end.call(this);
				}
			}
		}
		//构建执行对象
		,toObj: function(fun,args,con){
			if(typeof fun == 'function'){
				return new Queueobj(fun,args,con)
			}else if(typeof fun == 'object' && typeof fun.fun == 'function'){
				return fun;
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
			var r;
			if(fun){
				var aObbj = this.toObj.apply(this,arguments)
				this.lins.push(aObbj)
				if(aObbj.defer) r = aObbj.defer.promise;
			}
			this.start();
			return r;
		}
		//在队列头部插入并执行项
		,jump: function(fun){
			var r;
			if(fun){
				var aObbj = this.toObj.apply(this,arguments)
				this.lins.unshift(aObbj)
				if(aObbj.defer) r = aObbj.defer.promise;
			}
			this.start();
			return r;
		}
		
		/**队列控制**/
		
		//开始执行队列
		,start: function(){
			this._stop = 0;
			do{
				this.next();
			}while(this.lins.length && this.ing < this.max)
		}
		,stop: function(){
			this._stop = 1;
		}
		//修改并行单元数
		,setMax: function(max,a){ //修改执行单元并行数
			if(max <= 0) return;
			this.max = max;
			a || this.start();
		}
		//清空执行队列
		,'clear': function(){
			this.lins = [];
		}
		/**事件**/
		
		//有执行项添加进执行单元后执行
		,event_add: function(){}
		//执行单元成功后
		,event_succ: function(data){}
		//执行单元失败
		,event_err: function(err,obj){}
		//队列开始执行
		,event_begin: function(){}
		//队列运行结束执行
		,event_end: function(){}
	};
	
	return Queue;
};