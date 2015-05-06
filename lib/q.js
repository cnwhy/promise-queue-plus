"use strict";
var q = function(){
	return new Defer();
}
q.defer = q;

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
	return states[this.state+1];
}

var states = ['pending','rejected','fulfilled']

function Promise(){
	var _value,_reason,_state;
	this.state = -1; //pending:-1 ; fulfilled:1 ; rejected:0
	this.event = [];
}

Promise.prototype = {
	done: function(succ,err){
		var o = this;
		succ = (typeof succ == 'function') ? succ : null;
		err = (typeof err == 'function') ? err : null;
		this.event.push([succ,err,null])
		runDef.call(o)
	}
	,then: function(succ,err){
		var o = this;
		var nextQ = new Defer();
		succ = (typeof succ == 'function') ? succ : null;
		err = (typeof err == 'function') ? err : null;
		this.event.push([succ,err,nextQ])
		runDef.call(o)
		return nextQ.promise;
	}
	,fail: function(err){
		return this.then(null,err);
	}
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
				if(eArr.length > 3) return;
				eArr.push(1);
				var runFun = eArr[runFunNumb]
					,nextQ = eArr[2]
				var nextPromise;
				eArr.push(1);
				if(runFun){
					try{
						nextPromise = runFun.call(null,arg)
						if(o == nextPromise) throw "TypeError";
					}catch(e){
						nextQ && nextQ.reject(e);
						return;
					}
				}
				if(nextQ){
					if(nextPromise instanceof Promise && nextPromise.then){
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

module.exports = q;