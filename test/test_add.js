//不同Promise实现，插入效率测试
var q = require("q");
var bluebird = require("bluebird")
var QueueFun = require('../index');
var q_ = QueueFun.Q;
var Q0 = QueueFun.Queue(Promise);
var Q1 = QueueFun.Queue(q);
var Q2 = QueueFun.Queue();
var Q3 = QueueFun.Queue(bluebird);

function getTestFun(Pro){
	return function(i,err){
		var deferred = Pro.defer()
		setTimeout(function(){
			if(err){
				deferred.reject(err)
			}else{
				deferred.resolve(i)
			}
		},50)
		return deferred.promise;
	}
}
function testfun0(i,err){
	var deferred = Promise.defer()
	setTimeout(function(){
		if(err){
			deferred.reject(err)
		}else{
			deferred.resolve(i)
		}
	},(Math.random() * 200)>>0)
	return deferred.promise;
}
function testfun1(i,err){
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
function testfun2(i,err){
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
function testfun3(i,err){
	var deferred = bluebird.defer();
	setTimeout(function(){
		if(err){
			deferred.reject(err)
		}else{
			deferred.resolve(i)
		}
	},(Math.random() * 200)>>0)
	return deferred.promise;
}
var maxl = 50000,bxs = 500;
var q0 = new Q0(bxs)
var q1 = new Q1(bxs)
var q2 = new Q2(bxs)
var q3 = new Q3(bxs)
var _fun = function(){

}
function test0(){
	console.log('>>>>> 原生Promise ES6 测试开始')
	var def = Promise.defer();
	var testfun = getTestFun(Promise)
	var d0 = new Date();
	for(var k=0;k<maxl;k++){
		q0.push(testfun,[k]).then(_fun,_fun)
	}
	var d1 = new Date();
	console.log("添加 " + maxl + " 元素耗时  ---- " + (d1 - d0))
	q0.option("event_end",function(){
		var d2 = new Date();
		console.log("" + bxs + " 并行完成队列耗时  ---- " + (d2 - d1))
		console.log('<<<<<<<<<<<<<<')
		def.resolve()
	})
	q0.start();
	return def.promise;
}
function test1(){
	console.log('>>>>> q模块 测试开始')
	var def = q.defer();
	var testfun = getTestFun(q)
	var d0 = new Date();
	for(var k=0;k<maxl;k++){
		q1.push(testfun,[k]).then(_fun,_fun)
	}
	var d1 = new Date();
	console.log("添加 " + maxl + " 元素耗时  ---- " + (d1 - d0))
	q1.option("event_end",function(){
		var d2 = new Date();
		console.log("" + bxs + " 并行完成队列耗时  ---- " + (d2 - d1))
		console.log('<<<<<<<<<<<<<<')
		def.resolve()
	})
	q1.start();
	return def.promise;
}
function test2(){
	console.log('>>>>> 内置Promise 测试开始')
	var def = q_.defer();
	var testfun = getTestFun(q_)
	var d0 = new Date();
	for(var k=0;k<maxl;k++){
		q2.push(testfun,[k]).then(_fun,_fun)
	}
	var d1 = new Date();
	console.log("添加 " + maxl + " 元素耗时  ---- " + (d1 - d0))
	q2.option("event_end",function(){
		var d2 = new Date();
		console.log("" + bxs + " 并行完成队列耗时  ---- " + (d2 - d1))
		console.log('<<<<<<<<<<<<<<')
		def.resolve()
	})
	q2.start();
	return def.promise;
}
function test3(){
	console.log('>>>>> bluebird 测试开始')
	var def = bluebird.defer();
	var testfun = getTestFun(bluebird)
	var d0 = new Date();
	for(var k=0;k<maxl;k++){
		q3.push(testfun,[k]).then(_fun,_fun)
	}
	var d1 = new Date();
	console.log("添加 " + maxl + " 元素耗时  ---- " + (d1 - d0))
	q3.option("event_end",function(){
		var d2 = new Date();
		console.log("" + bxs + " 并行完成队列耗时  ---- " + (d2 - d1))
		console.log('<<<<<<<<<<<<<<')
		def.resolve()
	})
	q3.start();
	return def.promise;
}
//test0().then(test1).then(test2)

var readline = require('readline');
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("开始测试? ", function(answer) {
	rl.close();
	test0().then(test1).then(test2).then(test3)
});
//test1();
//test2();

// if(module && module.parent){
// 	module.exports = test_add;
// }else{
// 	test_add();
// }

