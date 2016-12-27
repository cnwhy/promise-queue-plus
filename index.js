var Queue = require("./lib/")(require("bluebird"));
module.exports = Queue;

// var Q = Queue.Q;
// //异步函数
// function fun2(i,err){

// 	if(this == null) console.log(i,err);
// 	var deferred = Q.defer();
// 	setTimeout(function(){
// 		if(err){
// 			deferred.reject(err)
// 		}else{
// 			deferred.resolve(i)
// 		}
// 	},30)
// 	//},(Math.random() * MAXTIME)>>0)
// 	return deferred.promise;
// }

// function fun3(v,i,arr){
// 	//console.log(v);
// 	return fun2.apply(null,[].concat(v));
// 	//return fun2(v);
// }

// var done=function(t){
// 	console.log(t);
// }

// var q1 = new Queue(1);
// var arr = [0,1,2]
// q1.allLike(arr,fun3,1).then(function(data){
// 	if(data.join('') !== '012')return done("返回错误");
// 	done(data);
// })
