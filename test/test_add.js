//不同Promise实现，插入效率测试
var q = require("q");
var QueueFun = require('../index');
var q_ = QueueFun.Q;
var Q0 = QueueFun.Queue(Promise);
var Q1 = QueueFun.Queue(q);
var Q2 = QueueFun.Queue();

function testfun(i,err){
	var deferred = q.defer();
	setTimeout(function(){
		if(err){
			deferred.reject(err)
		}else{
			deferred.resolve(i)
		}
	},(Math.random() * 200)>>0)
	return deferred.promise;
}

function testfun_(i,err){
	var deferred = q_.defer();
	setTimeout(function(){
		if(err){
			deferred.reject(err)
		}else{
			deferred.resolve(i)
		}
	},(Math.random() * 200)>>0)
	return deferred.promise;
}

function test_add(){
	var deferred = q_.defer();
	try{
		console.log('>>>>添加效率测试')
		var q0 = new Q0(1000)
		var q1 = new Q1(1000)
		var q2 = new Q2(1000)
		
		var maxl = 50000
		var d0 = new Date();
		for(var k=0;k<maxl;k++){
			q0.push(testfun,[k]).then(console.log,console.error)
		}
		var d1 = new Date();
		console.log(d1 - d0," >> 原生Promise ES6")
		for(var i=0;i<maxl;i++){
			q1.push(testfun_,[i]).then(console.log,console.error)
		}
		var d2 = new Date();
		console.log(d2 - d1," >> q模块")
		for(var n=0;n<maxl;n++){
			q2.push(testfun,[n]).then(console.log,console.error)
		}
		var d3 = new Date();
		console.log(d3 - d2," >> 内置Promise")
		console.log('<<<<添加效率检测完毕')
		deferred.resolve("OK")
	}catch(e){
		deferred.reject(e);
	}
	return deferred.promise;
}
if(module && module.parent){
	module.exports = test_add;
}else{
	test_add();
}

