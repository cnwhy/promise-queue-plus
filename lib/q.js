"use strict";
var nextTick = (typeof process == 'object' && process.nextTick) ? process.nextTick : setTimeout;
var q = {}
q.defer = function(){
	return new Defer();
};

q.Promise = function(fun){
	if(typeof fun !== "function") throw "TypeError";
	var def = new Defer();
	fun.call(null,def.resolve,def.reject);
	return def.promise;
}

var Defer = function(){
	var d1 = new Date();
	this.promise = new _Promise()
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
Defer.prototype.resolve = function(data){
	setState.call(this.promise,1,data);
}
Defer.prototype.reject =  function(err) {
	setState.call(this.promise,0,err);
}
Defer.prototype.getState = function(){
	return states[this.promise.state+1];
}

function _Promise(){
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
	var o = this;
	var arg = o.state ? o.value : o.reason;
	var runFunNumb = o.state ? 0 : 1;
	nextTick(function(){
		while(o.event.length){
			var eArr = o.event.shift();
			var runFun = eArr[runFunNumb]
				,nextQ = eArr[2]
				,spread = eArr[3]
			var nextPromise;
			if(runFun){
				try{
					nextPromise = spread ? runFun.apply(null,[].concat(arg)) : runFun.call(null,arg)
					if(o == nextPromise) throw "TypeError";
				}catch(e){
					nextQ && nextQ.reject(e);
					return;
				}
			}
			if(!nextQ) return;
			var type = typeof nextPromise;
			var resolvePromise = function(data){nextQ.resolve(data)}
			var rejectPromise = function(err){nextQ.reject(err)}
			if(nextPromise instanceof _Promise || ((type == "function" || type == "object") && typeof nextPromise.then == "function")){
				try{
					nextPromise.then.call(nextPromise,resolvePromise,rejectPromise)
				}catch(e){
					rejectPromise(e);
				}
			}else if(runFun){
				resolvePromise(nextPromise)
			}else if(o.state){
				resolvePromise(arg);
			}else{
				rejectPromise(arg)
			}
		}
	},0)
};
_Promise.prototype = {
	done: function(succ,err){
		addEvent.call(this,succ,err)
		runDef.call(this)
	}
	,then: function(succ,err){
		var nextQ = new Defer();
		addEvent.call(this,succ,err,nextQ)
		runDef.call(this)
		return nextQ.promise;
	}
	,spread: function(succ,err){
		var nextQ = new Defer();
		addEvent.call(this,succ,err,nextQ,1)
		runDef.call(this)
		return nextQ.promise;
	}
	,fail: function(err){
		return this.then(null,err);
	}
}

//all to Promis
var toPromis = q.toPromis = function(obj){
	if(obj instanceof _Promise){
		return obj;
	}
	var nextQ = new Defer();
	if(typeof obj == "function"){
		if(typeof obj.then == "function") return obj;
		try{
			var nextPromise = obj()
			var type = typeof nextPromise;
			if(nextPromise instanceof _Promise){
				return nextPromise
			}else if((type == "function" || type == "object") && typeof nextPromise.then == "function"){
				return nextPromise;
			}
			nextQ.resolve(nextPromise)
		}catch(e){
			nextQ.reject(e);
		}
	}
	nextQ.resolve(obj);
	return nextQ.promise;
}

/**仿Ｑ模块扩展**/
//callback Adapter 
function cbAdapter(def){
	return function(err,data){
		if(err) return def.reject(err);
		def.resolve(data)
	}
}

q.all = function(proArr){
	var def = new Defer();
	var dataArr = [];
	var _tempI = 0;
	for(var i=0;i<proArr.length;i++){
		+function(){
			var _i = i;
			nextTick(function(){
				var _p = proArr[_i];
				var xxx = toPromis(_p);
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
		}()
	}
	return def.promise;
}

q.any = function(proArr){
	var def = new Defer();
	var dataArr = [];
	var _tempI = 0;
	for(var i=0;i<proArr.length;i++){
		+function(){
			var _i = i;
			nextTick(function(){
				var _p = proArr[_i];
				var xxx = toPromis(_p);
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

/*封装CPS*/
q.nfcall = function(f){
	var def = new Defer();
	var argsArray = Array.prototype.slice.call(arguments,1)
	argsArray.push(cbAdapter(def))
	f.apply(null,argsArray)
	return def.promise;
}

q.nfapply = function(f,args){
	var def = new Defer();
	if(Object.prototype.toString.call(args) === '[object Array]'){
		args.push(cbAdapter(def));
		f.apply(null,args)
	}else{
		throw "args TypeError"
	}
	return def.promise;
}

q.denodeify = function(f){
	return function(){
		return q.nfapply(f,Array.prototype.slice.call(arguments))
	}
}

module.exports = q;