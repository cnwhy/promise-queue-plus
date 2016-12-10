//不同Promise实现，插入效率测试
var QueueFun = require('../index');
var q = require("q");
var bluebird = require("bluebird")
var q_ = QueueFun.Q;
var nq = require('../lib/promise');

bluebird.deferred = function(){
	return bluebird.defer();
}
q.deferred = function(){
	return q.defer();
}

if(typeof Promise == 'function'){
	Promise.deferred = function () {
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
	//{P:q,name:"q 模块"},
	{P:bluebird,name:"bluebird 模块"},
	{P:q_,name:"内置promise模块"},
	{P:nq,name:"重写的promise模块"},
	//{P:Promise,name:"原生Promise"}
]
function getTestFun(Pro){
	return function(i,err){
		var deferred = Pro.deferred()
		setTimeout(function(){
			if(err){
				deferred.reject(err)
			}else{
				deferred.resolve(i)
			}
		},0)
		return deferred.promise;
	}
}

var maxl = 50000,bxs = 100;
var _fun = function(){}
function test(P,name){
	var queue = new (QueueFun.Queue(P))(bxs)
	console.log('>>>>> '+name+' 测试开始')
	def = P.deferred();
	var testfun = getTestFun(P)
	var d0 = new Date();
	for(var k=0;k<maxl;k++){
		queue.push(testfun,[k]).then(_fun,_fun)
	}
	var d1 = new Date();
	console.log("添加 " + maxl + " 元素耗时  ---- " + (d1 - d0))
	queue.option("event_end",function(){
		var d2 = new Date();
		console.log("" + bxs + " 并行完成队列耗时  ---- " + (d2 - d1))
		console.log('<<<<<<<<<<<<<<')
		def.resolve()
	})
	queue.start();
	return def.promise;
}

var readline = require('readline');
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("开始测试? ", function(answer) {
	rl.close();
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
	//test1().then(test3).then(test2);
});
//test1();
//test2();

// if(module && module.parent){
// 	module.exports = test_add;
// }else{
// 	test_add();
// }

