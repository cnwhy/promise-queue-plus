"use strict";
var q = function(){
	return new Defer();
}
q.defer = q;
q.all = function(proArr){
	var def = new Defer();
	var dataArr = [];
	var _tempI = 0;
	for(var i=0;i<proArr.length;i++){
		+function(){
			var _i = i;
			setTimeout(function(){
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
			setTimeout(function(){
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

q.Promise = function(fun){
	if(typeof fun !== "function") throw "TypeError";
	var def = new Defer();
	fun.call(null,def.resolve,def.reject);
	return def.promise;
}

var states = ['pending','rejected','fulfilled']

var Defer = function(){
	this.promise = new Promise()
}

Defer.prototype.resolve = function(data){
	resolve.call(this.promise,data);
}
Defer.prototype.reject =  function(err) {
	reject.call(this.promise,err);
}
Defer.prototype.getState = function(){
	return states[this.promise.state+1];
}


function Promise(){
	var _value,_reason,_state;
	this.state = -1; //pending:-1 ; fulfilled:1 ; rejected:0
	this.event = [];
}

Promise.prototype = {
	done: function(succ,err){
		var o = this;
		// succ = (typeof succ == 'function') ? succ : null;
		// err = (typeof err == 'function') ? err : null;
		// this.event.push([succ,err,null])
		addEvent.call(o,succ,err)
		runDef.call(o)
	}
	,then: function(succ,err){
		var o = this;
		var nextQ = new Defer();
		// succ = (typeof succ == 'function') ? succ : null;
		// err = (typeof err == 'function') ? err : null;
		// this.event.push([succ,err,nextQ])
		addEvent.call(o,succ,err,nextQ)
		runDef.call(o)
		return nextQ.promise;
	}
	,spread: function(succ,err){
		var o = this;
		var nextQ = new Defer();
		// succ = (typeof succ == 'function') ? succ : null;
		// err = (typeof err == 'function') ? err : null;
		// this.event.push([succ,err,nextQ,1])
		addEvent.call(o,succ,err,nextQ,1)
		runDef.call(o)
		return nextQ.promise;
	}
	,fail: function(err){
		return this.then(null,err);
	}
}

function addEvent(succ,err,nextQ,spread){
	succ = (typeof succ == 'function') ? succ : null;
	err = (typeof err == 'function') ? err : null;
	this.event.push([succ,err,nextQ,spread])
	
}
function runDef(){
	if(!~this.state) return;
	var o = this;
	setTimeout(function(){
		var arg = o.state ? o.value : o.reason;
		var runFunNumb = o.state ? 0 : 1;
		for(var i = 0; i<o.event.length; i++){
			+function(){
				var eArr = o.event[i];
				if(eArr.length > 4) return;
				eArr.push(1);
				var runFun = eArr[runFunNumb]
					,nextQ = eArr[2]
					,spread = eArr[3]
				var nextPromise;
				eArr[4]=1;
				if(runFun){
					try{
						nextPromise = spread ? runFun.apply(null,[].concat(arg)) : runFun.call(null,arg)
						if(o == nextPromise) throw "TypeError";
					}catch(e){
						nextQ && nextQ.reject(e);
						return;
					}
				}
				if(nextQ){
					var type = typeof nextPromise;
					if(nextPromise instanceof Promise || ((type == "function" || type == "object") && typeof nextPromise.then == "function")){
						nextPromise.then(function(d){
							nextQ.resolve(d)
						},function(err){
							nextQ.reject(err)
						})
					}else if(runFun){
						nextQ.resolve(nextPromise)
					}else if(o.state){
						nextQ.resolve(arg);
					}else{
						nextQ.reject(arg)
					}
				}
			}()
		}
	},0)
};

function resolve(data){
	if(~this.state) return;
	this.value = data;
	this.state = 1
	runDef.call(this);
	return;
}

function reject(reason){
	if(~this.state) return;
	this.reason = reason;
	this.state = 0;
	runDef.call(this);
	return;
}

function toPromis(obj){
	if(obj instanceof Promise){
		return obj;
	}
	var nextQ = new Defer();
	if(typeof obj == "function"){
		if(typeof obj.then == "function") return obj;
		try{
			var nextPromise = obj()
			var type = typeof nextPromise;
			if(nextPromise instanceof Promise){
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
module.exports = q;