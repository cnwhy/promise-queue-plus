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

var status = ['pending','fulfilled','rejected']

function Promise(){
	var _value,_reason,_state;
	this.state = -1; //pending:-1 ; fulfilled:1 ; rejected:0
	this.event = [];
}

Promise.prototype = {
	done: function(succ,err){		
		succ = (typeof succ == 'function') ? succ : null;
		err = (typeof err == 'function') ? err : null;
		this.event.push([succ,err,null])
	}
	,then: function(succ,err){
		var nextQ = new Defer();
		succ = (typeof succ == 'function') ? succ : null;
		err = (typeof err == 'function') ? err : null;
		this.event.push([succ,err,nextQ])
		return nextQ.promise;
	}
	,fail: function(err){
		return this.then(null,err);
	}
}

function resolve(data){
	if(~this.state) return;
	this.value = data;
	this.state = 1
	var o = this;
	setTimeout(function(){
		for(var i = 0; i<o.event.length; i++){
			+function(){
				var _i = i
					,eArr = o.event[_i]
					,succ = eArr[0]
					,nextQ = eArr[2]
				var nextPromise;
				if(succ){
					try{
						nextPromise = succ.call(null,o.value)
						if(o == nextPromise) throw "TypeError";
					}catch(e){
						nextQ && nextQ.reject(e);
						return;
					}
				}
				if(nextQ){
					if(nextPromise instanceof Promise && nextPromise.then && nextPromise.done){
						nextPromise.done(function(d){
							nextQ.resolve(d)
						},function(err){
							nextQ.reject(err)
						})
					}else if(succ){
						nextQ.resolve(nextPromise)
					}else{
						nextQ.resolve(o.value);
					}
				}
			}()
		}
	},0)
}

function reject(reason){
	if(~this.state) return;
	this.reason = reason;
	this.state = 0;
	var o = this;
	setTimeout(function(){
		for(var i = 0; i<o.event.length; i++){
			+function(){
				var _i = i
					,eArr = o.event[_i]
					,err = eArr[1]
					,nextQ = eArr[2];
				var nextPromise;
				//console.log(eArr);
				if(err){
					try{
						nextPromise = err.call(null,o.reason)
						if(o == nextPromise) throw "TypeError";
					}catch(e){
						nextQ && nextQ.reject(e);
						return;
					}
				}else if(!nextQ){
					throw o.reason;
					return;
				}

				if(nextQ){
					if(nextPromise instanceof Promise && nextPromise.then && nextPromise.done){
						nextPromise.done(function(d){
							nextQ.resolve(d)
						},function(err){
							nextQ.reject(err)
						})
					}else if(err){
						nextQ.resolve(nextPromise)
					}else{
						nextQ.reject(o.reason)
					}
					//nextQ.reject(o.reason)
				}
			}()
		}
	},0)
}

module.exports = q;