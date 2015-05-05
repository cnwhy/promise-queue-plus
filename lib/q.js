"use strict";
var q = {}
q.defer = function(){
	return new Q();
}

var Q = function(){
	this.promise = new Promise()
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

function Promise(){
	this.state = -1
	this.event = []
	this.data = {}
}

Promise.prototype = {
	resolve: function(data){
		if(~this.state) return;
		this.data.value = data;
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
							nextPromise = succ.call(o,o.data.value)
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
							nextQ.resolve(o.data.value);
						}
					}
				}()
			}
		},0)
	}
	,reject: function(reason){
		if(~this.state) return;
		this.data.reason = reason;
		this.state = 0;
		var o = this;
		setTimeout(function(){
			//console.log(o.data)
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
								nextPromise = err.call(o,o.data.reason)
							}catch(e){
								nextQ && nextQ.reject(e);
								return;
							}
						}else if(!nextQ){
							throw o.data.reason;
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
								nextQ.reject(o.data.reason)
							}
							//nextQ.reject(o.data.reason)
						}
					}()
				}
			//}
		},0)
		// setTimeout(function(){
			// if(o.event.err){
				// o.event.err.call(o,o.data.reason)
			// }
			// if(o.event.fail){
				// o.event.fail.call(o,o.data.reason)
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