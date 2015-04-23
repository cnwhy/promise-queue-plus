//适用于Q 等 Promise 模式 的队列;
var Queueobj = function(fun,configObj){//执行单元对像
	var def = {
		'errNumber':0
	}
	var events = ['event_suu','event_err'] //扩展预留
	this.fun = fun;
	for(var i in def){
		this[i] = def[i]
	}
	if(typeof configObj == "object"){
		for(var i in def){
			if(typeof configObj[i] != 'undefined'){
				this[i] = configObj[i]
			}
		}
	}
}

var Promise = function(max,suu,err,begin,end) {
	this.max = max;
	this.ing = 0;
	this.lins = [];
	this.isPlay = false;
	if(typeof suu == 'function') this.event_suu = suu;
	if(typeof err == 'function') this.event_err = err;
	if(typeof begin == 'function') this.event_begin = begin;
	if(typeof end == 'function') this.event_end = end;
}
Promise.prototype = {
	//执行下一项
	next : function(){
		if(this.ing < this.max){
			var _Obj = this.lins.shift()
			if(_Obj){
				var o = this;
				o.isPlay || o.event_begin.call(this)
				o.isPlay = true;
				o.ing += 1;
				_Obj.fun().done(function(data){
					o.event_suu.call(o,data,_Obj);
					o.ing -= 1;
					o.play();
				},function(err){
					_Obj.errNumber += 1;
					o.event_err.call(o,err,_Obj);
					o.ing -= 1;
					o.play();
				})
			}else{
				if(this.ing <= 0){
					this.isPlay = false;
					this.event_end();
				}
			}
		}
	}
	//构建执行对象
	,toObj: function(fun){
		if(typeof fun == 'function'){
			end = 1;
			return new Queueobj(fun)
		}else if(typeof fun == 'object' && typeof fun.fun == 'function' ){
			return fun;
		}
	}
	//向队列尾部增加执行项,若队列未启动，暂时不会被执行
	,'push' : function(){ 
		var aObbj = this.toObj.apply(this,arguments)
		if(!aObbj) return;
		this.lins.push(aObbj)
		this.event_add.apply(this,aObbj);
	}
	//向队列头部增加执行项,若队列未启动，暂时不会被执行
	,'unshift': function(){
		var aObbj = this.toObj.apply(this,arguments)
		if(!aObbj) return;
		this.lins.unshift(aObbj)
		this.event_add.apply(this,aObbj);
	}
	//添加执行项，并会启动队列, 不会触发event_add
	,go: function(fun){ 
		if(fun){
			var aObbj = this.toObj.apply(this,arguments)
			this.lins.push(aObbj)
		}
		this.play();
	}
	//在队列头部插入并执行项
	,jump: function(fun){
		if(fun){
			var aObbj = this.toObj.apply(this,arguments)
			this.lins.unshift(aObbj)
		}
		this.play();
	}
	
	/**队列控制**/
	
	//开始执行队列
	,play: function(){
		do{
			this.next();
		}while(this.lins.length && this.ing < this.max)
	}
	//修改并行单元数
	,setMax: function(max,play){ //修改执行单元并行数
		if(max <= 0) return;
		this.max = max;
		play || this.play();
	}
	//清空执行队列
	,'clear': function(){
		this.lins = [];
	}
	
	/**事件**/
	
	//有执行项添加进执行单元后执行
	,event_add: function(){}
	//执行单元成功后
	,event_suu: function(data){}
	//执行单元失败
	,event_err: function(err,obj){
		//console.log(arguments);
	}
	//队列开始执行
	,event_begin: function(){}
	//队列运行结束执行
	,event_end: function(){
		//console.log('队列己完成!')
	}
}
module.exports = Promise;