function isPlainObject(obj) {
	if (obj === null || typeof(obj) !== "object" || obj.nodeType || (obj === obj.window)) {
		return false;
	}
	if (obj.constructor && !Object.prototype.hasOwnProperty.call(obj.constructor.prototype, "isPrototypeOf")) {
		return false;
	}
	return true;
}

module.exports = function(Promise,obj){
	var QClass;
	if(obj){
		QClass = obj;
	}else{
		QClass = function(fun){
			//this = new Promise(fun);
			var defer = QClass.defer();
			try{
				fun(defer.resolve,defer.reject);
			}catch(e){
				defer.reject(e);
			}
			return defer.promise;
		};
	}

	if(!QClass.Promise && Promise != obj) QClass.Promise = Promise;

	//defer
	if(typeof Promise.defer == "function"){
		QClass.defer = Promise.defer
	}else if(typeof Promise.deferred == "function"){
		QClass.defer = Promise.deferred
	}else{
		QClass.defer = function() {
			var resolve, reject;
			var promise = new Promise(function(_resolve, _reject) {
				resolve = _resolve;
				reject = _reject;
			});
			return {
				promise: promise,
				resolve: resolve,
				reject: reject
			};
		}
	}

	//delay
	if(typeof Promise.delay == "function"){
		QClass.delay = Promise.delay;
	}else{
		QClass.delay = function(ms){
			var defer = QClass.defer();
			setTimeout(defer.resolve,ms)
			return defer.promise;
		}
	}

	//resolve
	if(typeof Promise.resolve == "function"){
		QClass.resolve = Promise.resolve;
	}else{
		QClass.resolve = function(obj){
			return new Promise(function(ok,no){
				ok(obj);
			})
		}
	}

	//reject
	if(typeof Promise.reject == "function"){
		QClass.reject = Promise.reject;
	}else{
		QClass.reject = function(obj){
			return new Promise(function(ok,no){
				no(obj);
			})
		}
	}

	function getall(map){
		return function(promises) {
			var defer = QClass.defer();
			var data,_tempI = 0;
			var fillData = function(i){
				var _p = promises[i]
				QClass.resolve(_p).then(function(d) {
					data[i] = d;
					if (--_tempI == 0) {
						defer.resolve(data);
					}
				}, function(err) {
					defer.reject(err);
				})
				_tempI++;
			}
			if(Object.prototype.toString.call(promises) === '[object Array]'){
				data = [];
				for(var i = 0; i<promises.length; i++){
					fillData(i);
				}
			}else if(map && isPlainObject(promises)){
				data = {}
				for(var i in promises){
					fillData(i);
				}
			}else{
				defer.reject(new TypeError());
			}
			return defer.promise;
		}

	}

	//all 
	if(typeof Promise.all == "function"){
		QClass.all = Promise.all;
	}else{
		QClass.all = getall()
	}

	if (typeof Promise.allMap == "function") {
		QClass.allMap = Promise.allMap;
	} else {
		QClass.allMap = getall(true);
	}

	//map
	if(typeof Promise.map == "function"){
		QClass.map = Promise.map;
	}else{
		QClass.map = function(data,mapfun,options){
			var defer = QClass.defer();
			var promiseArr = [];
			var concurrency = options ? +options.concurrency : 0

			//无并发控制
			if(concurrency == 0 || concurrency != concurrency){
				for(var i in data){
					promiseArr.push(mapfun(data[i],i,data));
				}	
				QClass.all(promiseArr).then(defer.resolve,defer.reject)
				return defer.promise;
			}
			var k = 0;
			var keys = (function(){
				var ks = [];
				for(var k in data){
					ks.push(k);
				}
				return ks;
			})();
			function next(){
				if(k<keys.length){
					var key = keys[k];
					var promise = QClass.resolve(mapfun(data[key],key,data)).then(function(v){
						next();
						return v;
					},defer.reject);
					promiseArr.push(promise);
					concurrency--;
					k++;
				}else{
					QClass.all(promiseArr).then(defer.resolve,defer.reject);
				}
			}
			do{
				next()
			}while(concurrency>0 && k<keys.length)

			return defer.promise
		}
	}

	//any | race
	if(typeof Promise.race == "function"){
		QClass.race = QClass.any = Promise.race;
	}else if(typeof Promise.any == "function"){
		QClass.race = QClass.any = Promise.any
	}else{
		QClass.race = QClass.any = function(promiseArr) {
			var defer = QClass.defer();
			var dataArr = [];
			var _tempI = 0;
			for (var i = 0; i < proArr.length; i++) {
				+ function() {
					var _i = i;
					//nextTick(function() {
						var _p = proArr[_i];
						QClass.resolve(_p).then(function(data) {
							defer.resolve(data);
						}, function(err) {
							defer.reject(err);
						})
					//}, 0)
				}()
			}
			return defer.promise;
		}
	}

	/*封装CPS*/
	//callback Adapter 
	function cbAdapter(defer){
		return function(err,data){
			if(err) return defer.reject(err);
			defer.resolve(data)
		}
	}
	QClass.nfcall = function(f){
		var _this = this === QClass ? null : this;
		var defer = QClass.defer();
		var argsArray = Array.prototype.slice.call(arguments,1)
		argsArray.push(cbAdapter(defer))
		f.apply(_this,argsArray)
		return defer.promise;
	}

	QClass.nfapply = function(f,args){
		var _this = this === QClass ? null : this;
		var defer = QClass.defer();
		if(Object.prototype.toString.call(args) === '[object Array]'){
			args.push(cbAdapter(defer));
			f.apply(_this,args)
		}else{
			throw "args TypeError"
		}
		return defer.promise;
	}

	QClass.denodeify = function(f){
		var _this = this === QClass ? null : this;
		return function(){
			return QClass.nfapply.call(_this,f,Array.prototype.slice.call(arguments))
		}
	}
	return QClass;
}