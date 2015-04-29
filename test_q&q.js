var q = require("q");
var q_ = require('./index').Q;
var Q0 = require('./index').Promise();
var Q1 = require('./index').Promise(1);
var Q2 = require('./index').Promise(q);

function testfun(i,err){
	var deferred = q.defer();
	setTimeout(function(){
		if(err){
			deferred.reject(new Error("err " + i))
		}else{
			deferred.resolve(i)
		}
	},(Math.random() * 2000)>>0)
	return deferred.promise;
}

function testfun_(i,err){
	var deferred = q_.defer();
	setTimeout(function(){
		if(err){
			deferred.reject(i)
		}else{
			deferred.resolve(i)
		}
	},(Math.random() * 2000)>>0)
	return deferred.promise;
}

function QandQ(){
	console.log('>>>>添加效率测试')
	q0 = new Q0(1000)
	q1 = new Q1(1000)
	q2 = new Q2(1000)
	
	var maxl = 100000
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
		q1.push(testfun,[i]).done(function(){},function(){})
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
		_test(1).fail(function(err){
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
Qtest();  //正常工作测试

