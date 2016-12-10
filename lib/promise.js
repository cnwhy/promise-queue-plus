var nextTick = process.nextTick;

function getThenableThen(obj){
	var then;
	var type = typeof obj;
	if(obj && (type == "function" || type == "object")){
		then = obj.then;
		if(typeof then == "function"){
			return then
		}
	}
}

function Promise_(fun){
	var defer = this.defer = new Defer(this);
	if(typeof fun == "function"){
		try{
			fun(defer.resolve,defer.reject);
		}catch(e){
			defer.reject(e)
		}
	}
}

function runThenable(then,obj){
	return new Promise_(function(yes,no){
		then.call(obj,function(value){
			if(value instanceof Promise_){
				return yes(value);
			};
			try{
				var _then = getThenableThen(value);
				if(_then){
						yes(runThenable(_then,value));
				}else{
					yes(value);
				}
			}catch(e){
				no(e);
			}
		},no);
	})
}

Promise_.resolve = function(obj){
	if(obj instanceof Promise_) return obj;
	var type = typeof obj;
	var promise = new Promise_()
		,resolve = promise.defer.resolve
		,reject = promise.defer.reject
	var then;
	try{
		then = getThenableThen(obj);
		if(then){
			runThenable(then,obj).then(resolve,reject);
			return promise;
		}
	}catch(e){
		reject(e);
	}
	resolve(obj);
	return promise;
}

Promise_.reject = function(err){
	return new Pormise(function(ok,no){
		no(err);
	})
}

Promise_.deferred = Promise_.defer = function(){
	var promise = new Promise_();
	return {
		promise: promise,
		resolve: promise.defer.resolve,
		reject: promise.defer.reject
	}
}

Promise_.prototype.then = function(ok,no){
	var status = this.defer.status;
	var nextPromise = new Promise_();
	//if(!~status){
		this.defer.events.push([ok,no,nextPromise]);
	// }else if(status && typeof ok == "function"){
	// 	runThenFun(ok,this.defer.value,nextPromise,status);
	// }else if(!status && typeof no == "function"){
	// 	runThenFun(no,this.defer.reason,nextPromise,status)
	// }else{
	// 	if(status) nextPromise.defer.resolve(this.defer.value)
	// 	else nextPromise.defer.reject(this.defer.reason);
	// }
	funEvent.call(this.defer)
	return nextPromise;
}

function Defer(promise){
	var self = this;
	this.status = -1;  //pending:-1 ; fulfilled:1 ; rejected:0
	this.events = [];
	this.promise = promise;
	this.lock = false;
	var resolve_ = function(value){
		changeStatus.call(self,1,value)
	}

	var reject_ = function(reason){
		changeStatus.call(self,0,reason)
	}

	this.resolve = function(value){
		if(self.lock) return;
		if(value instanceof Promise_){
			self.lock = true;
			value.then(resolve_,reject_)
		}else{
			try{			
				var then = getThenableThen(value);
				if(then){
					self.lock = true;
					runThenable(then,value).then(resolve_,reject_);
				}else{
					resolve_(value)
				}
			}catch(e){
				self.reject(e);
			}
		}
	}

	this.reject = function(reason){
		if(self.lock) return;
		reject_(reason);
	}
}

function changeStatus(status,arg){
	var self = this;
	if(~this.status) return;
	this.status = status;
	if(status){
		this.value = arg
	}else{
		this.reason = arg;
	}
	nextTick(function(){
		funEvent.call(self)
	},0)
}

function funEvent(){
	if(!~this.status) return;
	var o = this,_event = o.events;
	var arg = o.status ? o.value : o.reason;
	var runFunNumb = o.status ? 0 : 1;
	while(_event.length){
		(function(eArr){
			var runFun = eArr[runFunNumb]
				,nextQ = eArr[2]
			runThenFun(runFun,arg,nextQ,o.status);
		})(_event.shift())
	}
}

function runThenFun(runFun,arg,nextQ,status){
	var nextPromise,centerPromise;
	var resolve,reject
	if(nextQ){
		resolve = nextQ.defer.resolve
		reject = nextQ.defer.reject	
	}
	//Promize A+ 规则;
	if(typeof runFun == 'function'){
		nextTick(function(){
			try{
				nextPromise = runFun(arg)
				if(nextQ === nextPromise) throw new TypeError();
			}catch(e){
				if(reject) reject(e)
				else throw e;
				return;
			}
			if(typeof nextPromise != 'undefined'){
				centerPromise = Promise_.resolve(nextPromise);
			}
			if(nextQ){
				if(centerPromise) resolve(centerPromise)
				else resolve(nextPromise)
			}
		},0)
	}else if(nextQ){
		if (status) resolve(arg)
		else reject(arg)
	}

}



module.exports = Promise_;