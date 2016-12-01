"use strict";
var nextTick = (typeof process == 'object' && process.nextTick) ? process.nextTick : setTimeout;
var q = function(obj){
	return toPromis(obj);
}
q.defer = function(){
	return new Defer();
};

q.Promise = function(fun){
	if(typeof fun !== "function") throw "TypeError";
	var def = new Defer();
	fun(def.resolve,def.reject);
	return def.promise;
}

var Defer = function(){
	var d1 = new Date();
	var tPromise = this.promise = new Promise_()
	this.resolve = function(data){
		setState.call(tPromise,1,data);
	}
	this.reject = function(err){
		setState.call(tPromise,0,err);
	}
}
//States
var states = ['pending','rejected','fulfilled']
//promise 通过/拒绝 
function setState(state,arg){
	if(~this.state) return;
	this.state = state;
	if(state){
		this.value = arg
	}else{
		this.reason = arg;
	}
	runDef.call(this);
}

Defer.prototype.getState = function(){
	return states[this.promise.state+1];
}

function Promise_(){
	var _value,_reason,_state;
	this.state = -1; //pending:-1 ; fulfilled:1 ; rejected:0
	this.event = [];
}
function addEvent(succ,err,nextQ,spread){
	succ = (typeof succ == 'function') ? succ : null;
	err = (typeof err == 'function') ? err : null;
	this.event.push([succ,err,nextQ,spread])
}
function runDef(){
	if(!~this.state) return;
	var o = this,_event = o.event;
	var arg = o.state ? o.value : o.reason;
	var runFunNumb = o.state ? 0 : 1;
	nextTick(function(){
		while(_event.length){
			(function(eArr){
				//var eArr = o.event.shift();
				var runFun = eArr[runFunNumb]
					,nextQ = eArr[2]
					,spread = eArr[3]
				var nextPromise;
				if(runFun){
					try{
						nextPromise = spread ? runFun.apply(null,[].concat(arg)) : runFun.call(null,arg)
						if(o === nextPromise) throw "TypeError";
					}catch(e){
						//console.log(e,nextQ)
						if(nextQ) nextQ.reject(e)
						else throw e;
						//return;
					}
				}
				if(!nextQ) return;
				var type = typeof nextPromise;
				//Promize A+ 规则;
				var rejectPromise = function(err){nextQ.reject(err)}
				if(nextPromise instanceof Promise_ || ((type == "function" || type == "object") && typeof nextPromise.then == "function")){
					try{
						nextPromise.then.call(nextPromise,nextQ.resolve,nextQ.reject)
					}catch(e){
						rejectPromise(e);
					}
				}else if(runFun){
					nextQ.resolve(nextPromise)
				}else if(o.state){
					nextQ.resolve(arg);
				}else{
					nextQ.reject(arg)
				}
			})(o.event.shift())
		}
	},0)
}
Promise_.prototype = {
	done: function(succ,err){
		addEvent.call(this,succ,err)
		runDef.call(this)
	}
	,spread: function(succ,err){
		var nextQ = new Defer();
		addEvent.call(this,succ,err,nextQ,1)
		runDef.call(this)
		return nextQ.promise;
	}
}
Promise_.prototype.then = 
Promise_.prototype.when = function(succ,err){
	var nextQ = new Defer();
	addEvent.call(this,succ,err,nextQ)
	runDef.call(this)
	return nextQ.promise;
}

//类似catch关键字功能
Promise_.prototype.fail =
Promise_.prototype['catch'] = function(err){
	return this.then(null,err);
}
//类似finally功能
Promise_.prototype.fin =
Promise_.prototype['finally'] = function(fun){
	var nextQ = new Defer();
	this.then(function(data){
		fun();	
		nextQ.resolve(data)
	},function(err){
		fun();
		nextQ.reject(err);
	})
	return nextQ.promise;
}

//all to Promis
var toPromis = q.toPromis = function(obj,norun){
	if(obj instanceof Promise_) return obj;
	var type = typeof obj;
	var nextQ = new Defer();
	if((type == "function" || type == "object") && typeof obj.then == "function"){
		try{
			obj.then(nextQ.resolve,nextQ.reject)
		}catch(e){
			nextQ.reject(e);
		}
		return nextQ.promise;
	}else if(type == "function" && !norun){
		try{
			var ret = obj();
		}catch(e){
			nextQ.reject(e);
			return nextQ.promise;
		}
		return toPromis(ret,true)
	}else{
		nextQ.resolve(obj);
		return nextQ.promise;
	}
}

/**仿Ｑ模块扩展**/
q.all = function(proArr){
	var def = new Defer();
	var dataArr = [];
	var _tempI = 0;
	for(var i=0;i<proArr.length;i++){
		(function(){
			var _i = i;
			nextTick(function(){
				var _p = proArr[_i];
				toPromis(_p).then(function(data){
					dataArr[_i] = data;
					_tempI++;
					if(_tempI == proArr.length){
						def.resolve(dataArr);
					}
				},function(err){
					def.reject(err);
				})
			},0)
		})()
	}
	return def.promise;
}
q.resolve = function(value){
	return q.toPromis(value,true);
}
q.reject = function(reason){
	var def = new Defer();
	def.reject(reason);
	return def.promise;
};

q.allMap = function(map){
	var def = new Defer();
	var dataMap = {};
	var _tempI = +function(){
		var n = 0;
		for(var k in map){
			n++;
		}
		return n;
	}();
	for(var i in map){
		(function(){
			var _i = i;
			nextTick(function(){
				var _p = map[_i];
				toPromis(_p).then(function(data){
					dataMap[_i] = data;
					_tempI--;
					if(!_tempI){
						def.resolve(dataMap);
					}
				},function(err){
					def.reject(err);
				})
			},0)
		})()
	}
	return def.promise;
}

q.any = q.race = function(proArr){
	var def = new Defer();
	var dataArr = [];
	var _tempI = 0;
	for(var i=0;i<proArr.length;i++){
		+function(){
			var _i = i;
			nextTick(function(){
				var _p = proArr[_i];
				toPromis(_p).then(function(data){
					def.resolve(data);
				},function(err){
					def.reject(err);
				})
			},0)
		}()
	}
	return def.promise;
}

//callback Adapter 
function cbAdapter(def){
	return function(err,data){
		if(err) return def.reject(err);
		def.resolve(data)
	}
}

/*封装CPS*/
q.nfcall = function(f){
	var _this = this === q ? null : this;
	var def = new Defer();
	var argsArray = Array.prototype.slice.call(arguments,1)
	argsArray.push(cbAdapter(def))
	f.apply(_this,argsArray)
	return def.promise;
}

q.nfapply = function(f,args){
	var _this = this === q ? null : this;
	var def = new Defer();
	if(Object.prototype.toString.call(args) === '[object Array]'){
		args.push(cbAdapter(def));
		f.apply(_this,args)
	}else{
		throw "args TypeError"
	}
	return def.promise;
}

q.denodeify = function(f){
	var _this = this === q ? null : this;
	return function(){
		return q.nfapply.call(_this,f,Array.prototype.slice.call(arguments))
	}
}

//延迟
q.delay = function(ms){
	var def = new Defer();
	setTimeout(def.resolve,ms)
	return def.promise;
}

module.exports = q;
