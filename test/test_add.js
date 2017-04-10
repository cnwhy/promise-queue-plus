//不同Promise实现，插入效率测试
var Queue = require('../src/queue');
var q = require("q");
var bluebird = require("bluebird")
var p1 = require('extend-promise/Promise/nextTick');
var p2 = require('extend-promise/Promise/setImmediate');
var p3 = require('extend-promise/Promise/setTimeout');


if(typeof Promise == 'function'){
	Promise.defer = function () {
	  var resolve, reject;
	  var promise = new Promise(function (_resolve, _reject) {
	    resolve = _resolve;
	    reject = _reject;
	  });
	  return {
	    promise: promise,
	    resolve: resolve,
	    reject: reject
	  };
	};
}

var Ps = [
	// {P:q,name:"q 模块"},
	{P:Promise,name:"原生Promise"},
	{P:bluebird,name:"bluebird 模块"},
	{P:p1,name:"nextTick"},
	{P:p2,name:"setImmediate"},
	{P:p3,name:"setTimeout"}
]

function getTestFun(Pro){
	return function(i,err){
		var deferred = Pro.defer()
		setTimeout(function(){
			if(err){
				deferred.reject(err)
			}else{
				deferred.resolve(i)
			}
		},1)
		return deferred.promise;
	}
}

var maxl = 50000,bxs = 500;
var _fun = function(){}
function test(P,name){
	var queue = new (Queue(P))(bxs)
	console.log('>>>>> '+name+' 测试开始')
	def = P.defer();
	var testfun = getTestFun(P)
	var d0 = new Date();
	for(var k=0;k<maxl;k++){
		queue.push(testfun,[k]).then(_fun,_fun)
	}
	var d1 = new Date();
	console.log("添加 " + maxl + " 元素耗时  ---- " + (d1 - d0))
	queue.option("queueEnd",function(){
		var d2 = new Date();
		console.log("" + bxs + " 并行完成队列耗时  ---- " + (d2 - d1))
		console.log('<<<<<<<<<<<<<<')
		def.resolve()
	})
	queue.start();
	return def.promise;
}

// var readline = require('readline');
// var rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout
// });

// rl.question("开始测试? ", function(answer) {
// 	rl.close();
	//test0().then(test1).then(test2).then(test3)
	var i = Ps.length - 1;
	function next(){
		var obj = Ps[i];
		if(obj && typeof Ps[i].P == 'function'){
			test(obj.P,obj.name).then(function(){
				next();
			})
		}
		i--;
	}
	next();
//});

//var queue = new (Queue.Queue(nq))(1);
// queue.push(function(){
// 	//return 1;
// 	throw "err";
// }).then(console.log.bind(null,'ok: '),console.log.bind(null,'no: '));
// queue.start();






