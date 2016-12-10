var QueueFun = require('./');
var Q = QueueFun.Q;

Q.resolve(1).then(function(v){
	console.log(v)
	return Q.resolve(2)
}).then(function(v){
	console.log(v);
	return Q.resolve(3)
}).then(function(v){
	console.log(v);
	throw 4;
	//return Q.reject(4)
}).then(function(v){
	//console.log(v);
	//return Q.resolve("4-suu")
}).then(null,console.log)


Q.Promise(function(yes,no){
	setTimeout(yes,1000,1)
}).then(function(v){
	console.log(v);
	return Q.Promise(function(yes,no){
		setTimeout(function(){
			yes(2)
		},1000)
	})
}).then(console.log);
// new Promise_(function(ok,no){
// 	setTimeout(function(){ok(1);},1000)
// }).then(function(v){
// 	console.log(v);
// 	return new Promise_(function(ok,no){
// 		setTimeout(function(){ok(2);},1000)
// 	})
// }).then(function(v){
// 	console.log(v)
// });