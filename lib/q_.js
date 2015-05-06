"use strict";
var q = function(){
	return new Promise();
}
q.defer = q;

var Promise = function(){
	this.promise = new PromiseObj(this)
	this.resolve = function(data){
		this.promise.resolve.call(this.promise,data);
	}
	this.reject = function(err) {
		this.promise.reject.call(this.promise,err);
	}
	// this.then = function(data){
		// this.promise.resolve.call(this.promise,data);
	// }
}

var status = ['pending','fulfilled','rejected']

function PromiseObj(pro){
	this._promise = pro;
	//var _value,_reason,_state;
	this.state = -1 //pending:-1 ; fulfilled:1 ; rejected:0
	this.event = []
}

PromiseObj.prototype.fulfilled = function(data){
	if(~this.state) return false;
	this.state = 1;
	this.value = data;
}

PromiseObj.prototype.fulfilled = function(data){
	if(~this.state) return false;
	this.reason = reason;
	this.state = 0;
}

PromiseObj.prototype = {
	resolve: function(data){
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
						}catch(e){
							nextQ && nextQ.reject(e);
							return;
						}
					}
					if(nextQ){
						if(nextPromise instanceof Promise && nextPromise.then && nextPromise.done){
							nextPromise.done(function(d){
								//console.log(d);
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
	,reject: function(reason){
		if(~this.state) return;
		this.reason = reason;
		this.state = 0;
		var o = this;
		setTimeout(function(){
			//if(o.event.err){
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
			//}
		},0)
		// setTimeout(function(){
			// if(o.event.err){
				// o.event.err.call(o,o.reason)
			// }
			// if(o.event.fail){
				// o.event.fail.call(o,o.reason)
			// }
			// var nextQ = o.getnextQ()
			// if(nextQ) nextQ.reject(err);
		// },0)
	}
	,done: function(succ,err){		
		succ = (typeof succ == 'function') ? succ : null;
		err = (typeof err == 'function') ? err : null;
		this.event.push([succ,err,null])
	}
	,then: function(succ,err){
		var nextQ = q.defer();
		succ = (typeof succ == 'function') ? succ : null;
		err = (typeof err == 'function') ? err : null;
		this.event.push([succ,err,nextQ])
		return nextQ.promise;
	}
	,fail: function(err){
		return this.then(null,err);
		// this.then(null,fail)
		// if(!this.nextQ) this.nextQ = q.defer();
		// return this.nextQ.promise
	}
}
module.exports = q;