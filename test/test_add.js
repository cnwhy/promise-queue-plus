var q = require("q");
var QueueFun = require('../index');
var q_ = QueueFun.Q;
var Q0 = QueueFun.Promise();
var Q1 = QueueFun.Promise(1);
var Q2 = QueueFun.Promise(q);

//var qqwry = require("lib-qqwry")

function testfun(i,err){
	var deferred = q.defer();
	setTimeout(function(){
		if(err){
			deferred.reject(err)
		}else{
			deferred.resolve(i)
		}
	},(Math.random() * 2000)>>0)
	return deferred.promise;
}

// testfun(1,2).then(function(data){
// 	console.log(data)
// }).done(null,function(err){
// 	console.log(err)
// })

//return;

function testfun_(i,err){
	var deferred = q_.defer();
	setTimeout(function(){
		if(err){
			deferred.reject(err)
		}else{
			deferred.resolve(i)
		}
	},(Math.random() * 2000)>>0)
	return deferred.promise;
}

if(0){
	
	var P1 = testfun(1,2)
	P1.then(function(d){
		var deferred = q.defer();
		//setTimeout(function(){
			console.log('1:' + d);
			deferred.resolve(1111)
		//},100)
		return deferred.promise;
	}).then(function(d){
		console.log('1then:' + d)
	}).done(function(d){
		console.log('1done:' + d)
	},function(err){
		console.log('1doneerr:' + err)
	})
	//return;
	P1.then(function(d){
		console.log('2:' + d)
		
		return 2222;
	}).then(function(d){
		console.log('2then:' + d)
	}).done(function(d){
		console.log('2done:' + d)
	},function(err){
		console.log('2doneerr:' + err)
	})
}

// testfun(2).done(function(data){
	// console.log(data)
// },function(err){
	// console.log(err)
// })



function QandQ(){
	console.log('>>>>添加效率测试')
	var q0 = new Q0(1000)
	var q1 = new Q1(1000)
	var q2 = new Q2(1000)
	
	var maxl = 50000
	var d0 = new Date();
	for(var k=0;k<maxl;k++){
		q0.push(testfun,[k],{
			"event_succ":function(data){}  //成功
			,"event_err":function(err){}  //失败
		})
	}
	var d1 = new Date();
	console.log("0: ",d1 - d0)
	for(var i=0;i<maxl;i++){
		q1.push(testfun_,[i]).done(function(){},function(){})
	}
	var d2 = new Date();
	console.log("1: ",d2 - d1)
	for(var n=0;n<maxl;n++){
		q2.push(testfun,[n]).done(function(){},function(){})
	}
	var d3 = new Date();
	console.log("q: ",d3 - d2)
	console.log('<<<<添加效率检测完毕')
}

function Qtest(){
	console.log('>>>> Qtest');
	_test().then(function(data){
		console.log(data)
		if('> done - succ OK' == data){
			console.log('> then OK')
		}
		_test(2).fail(function(err){
			console.log(err)
			if('> done - err OK' == err){console.log('> fail ok')}
			console.log('<<<< Qtest end')
		})
	})
}

function _test(a){
	var deferred = q_.defer();
	testfun_(1,0).then(function(data){
		console.log(data)
		return testfun_(2,a || 0)
	}).then(function(data){
		console.log(data)
		return testfun_(3,0)
	}).done(function(data){
		console.log(data);
		if(!a && data == 3){
			deferred.resolve('> done - succ OK');
		}else{
			deferred.resolve('> done - succ Err');
		}
	},function(err){
		console.log(err + " -- err")
		if(a && err == 2){
			deferred.reject('> done - err OK')
		}else{
			deferred.reject('> done - err Err')
		}
	})
	return deferred.promise;
}
QandQ();  //插入效率测试
//Qtest();  //正常工作测试

