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
		if(this.event.succ){
			setTimeout(function(){
				o.event.succ.call(o,o.data.succ)
			},0)
		}
		if(this.event.then){
			setTimeout(function(){
				o.event.succ.then(o,null,o.data.succ)
			},0)
		}
	}
	,reject: function(err){
		if(~this.status) return;
		this.data.err = err;
		this.status = 0;
		var o = this
		if(~this.status &&this.event.err){
			setTimeout(function(){
				o.event.err.call(o,o.data.err)
			},0)
		}
		if(this.event.then){
			setTimeout(function(){
				o.event.succ.then(o,o.data.err)
			},0)
		}
	}
	,done: function(succ,err){
		this.event.succ = succ;
		this.event.err = err;
	}
	,then: function(then){
		this.event.then = then;
	}
}
module.exports = q;