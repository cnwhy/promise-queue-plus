//var q = require("q");
var q = require('./index').Q;
var Q0 = require('./index').Promise();
var Q1 = require('./index').Promise(1);
var Q2 = require('./index').Promise(q);
function testfun(i){
	var deferred = q.defer();
	setTimeout(function(){
		if(i%3 == 1 || i == "Q3"){
			deferred.reject(new Error("err " + i))
		}else{
			deferred.resolve(i)
		}
	},(Math.random() * 4000)>>0)
	return deferred.promise;
}

function QandQ(){
	console.log('run')
	q0 = new Q0(1000)
	q1 = new Q1(1000)
	q2 = new Q2(1000)
	
	var maxl = 100000
	var d0 = new Date()
	for(var k=0;i<maxl;k++){
		q1.push(testfun,[k])
	}
	var d1 = new Date()
	for(var i=0;i<maxl;i++){
		q1.push(testfun,[i]).done(function(){},function(){})
	}
	var d2 = new Date()
	for(var n=0;n<maxl;n++){
		q2.push(testfun,[n]).done(function(){},function(){})
	}
	var d3 = new Date();
	console.log("0: ",d1 - d0)
	console.log("1: ",d2 - d1)
	console.log("q: ",d3 - d2)
	console.log('end')
}

function textQ(){
	// var kk = testfun(1).then(function(d){
		// console.log(d)
	// });
	
	// for(var i in kk){
		// console.log(i , kk[i])
	// }
	//console.log(kk)
	
	testfun(1).then(function(data){
		console.log(data);
		var k = testfun(2)
		//console.log(k)
		return k;
	})
	.then(function(data){
		console.log(data);
		return testfun(3)
	}).done(function(data){
		console.log(data);
	},function(err){
		console.log(err);
	})
}
textQ()
//QandQ();