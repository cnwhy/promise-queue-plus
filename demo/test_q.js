var QueueFun = require('../index');
var q_ = QueueFun.Q;
//var q_ = require('q')
var maxtime = 200

//同步函数
function fun1(i,err){
	var deferred = q_();
	if(err){
		deferred.reject(err)
	}else{
		deferred.resolve(i)
	}
	//console.log(deferred)
	return deferred.promise;
}
//异步函数
function fun2(i,err){
	var deferred = q_();
	setTimeout(function(){
		if(err){
			deferred.reject(err)
		}else{
			deferred.resolve(i)
		}
	},maxtime)
	//},(Math.random() * maxtime)>>0)
	return deferred.promise;
}
var a = fun2([1,2,3]).spread(function(a,b,c){
	console.log(c)
},console.error)
//console.log(a);

fun2([1,2,3]).spread(function(a,b,c){
	console.log(a)
	console.log(b)
	console.log(c)
})
//return;

q_.all([fun1(1),fun2(2),3,fun1(4),function(){
	return fun2(5);
}]).then(function(data){
	console.log(data);
},function(err){
	console.error(err);
})

FS = require("fs")
//Ｑ待实现
q_.nfcall(FS.readFile, "1.txt", "utf-8").then(console.log);
q_.nfapply(FS.readFile, ["2.txt", "utf-8"]).then(console.log);
var readFile = q_.denodeify(FS.readFile);
readFile("3.txt", "utf-8").then(console.log);

// var redisClientGet = q.nbind(redisClient.get, redisClient);
// return redisClientGet("user:1:id");

