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
	this.status = -1
	this.event = {}
	this.data = {}
}

Promise.prototype = {
	resolve: function(data){
		if(~this.status) return;
		this.data.succ = data;
		this.status = 1
		var o = this;
		setTimeout(function(){
			if(o.event.succ){
				o.event.succ.call(o,o.data.succ)
			}
			if(o.event.then){
				var nextPromise = o.event.then.call(o,o.data.succ)
				if(nextPromise instanceof Promise && nextPromise.then && nextPromise.done){
					nextPromise.done(function(data){
						o.nextQ.resolve(data)
					},function(err){
						o.nextQ.reject(err)
					})
				}
			}
		},0)
	}
	,reject: function(err){
		if(~this.status) return;
		this.data.err = err;
		this.status = 0;
		var o = this
		setTimeout(function(){
			if(o.event.err){
				o.event.err.call(o,o.data.err)
			}
			if(o.event.fail){
				o.event.fail.call(o,o.data.err)
			}
			var nextQ = o.getnextQ()
			if(nextQ) nextQ.reject(err);
		},0)
	}
	,done: function(succ,err){
		this.event.succ = succ;
		this.event.err = err;
	}
	,then: function(then,fail){
		if(typeof then == 'function') this.event.then = then;
		if(typeof fail == 'function') this.event.fail = fail;
		if(!this.nextQ) this.nextQ = q.defer();
		return this.nextQ.promise
	}
	,fail: function(fail){
		this.then(null,fail)
		if(!this.nextQ) this.nextQ = q.defer();
		return this.nextQ.promise
	}
	,getnextQ: function(){
		return this.nextQ;
	}
}
module.exports = q;