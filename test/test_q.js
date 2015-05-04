var assert = require("assert");

var QueueFun = require('../index');
var q_ = QueueFun.Q;
//var q_ = require('q')
var maxtime = 1000

//同步函数
function fun1(i,err){
	var deferred = q_.defer();
	if(err){
		deferred.reject(err)
	}else{
		deferred.resolve(i)
	}
	return deferred.promise;
}
//异步函数
function test2(i,err){
	var deferred = q_.defer();
	setTimeout(function(){
		if(err){
			deferred.reject(err)
		}else{
			deferred.resolve(i)
		}
	},(Math.random() * maxtime)>>0)
	return deferred.promise;
}

var xc;
var succ = function(k,done){
			return function(data){
				clearTimeout(xc)
				if(data !== k) throw "返回参数错误";
				done();
			}
	}
	,err = function(done){
		return function(err){
			clearTimeout(xc)
			throw "回调错误";
			done();
		}
	}
	,timeout_succ = function(done){
		return setTimeout(function(){
				done();
			},maxtime+10)
	}
	,timeout_err = function(done,errmsg){
		return setTimeout(function(){
				throw errmsg;
				done();
			},maxtime+10)
	}
//普通测试
describe('测试Queue-fun内部模拟q的异步函数类', function(){
    describe('#单次调用测试', function(){
		describe('.then 方法', function(){
			
			it('.then(succ) 同步函数执行 成功', function(done){
				xc = timeout_err(done,"未成功调用succ");
				fun1(1).then(succ(1,done))
			})
			it('.then(succ) 同步函数执行 失败', function(done){
				xc = timeout_succ(done);
				fun1(1,2).then(err(done))
			})
			it('.then(succ,err) 同步函数执行 成功', function(done){
				xc = timeout_err(done,"未成功调用succ");
				fun1(1).then(succ(1,done),err(done))
			})
			it('.then(succ,err) 同步函数执行 失败', function(done){
				xc = timeout_err(done,'未成功调用err');
				fun1(1,2).then(err(done),succ(2,done))
			})
			it('.then(succ) 异步函数执行 成功', function(done){
				xc = timeout_err(done,"未成功调用succ");
				test2(1).then(succ(1,done))
			})
			it('.then(succ) 异步函数执行 失败', function(done){
				xc = timeout_succ(done);
				test2(1,2).then(err(done))
			})
			it('.then(succ,err) 异步函数执行 成功', function(done){
				xc = timeout_err(done,"未成功调用succ");
				test2(1).then(succ(1,done),err(done))
			})
			it('.then(succ,err) 异步函数执行 失败', function(done){
				xc = timeout_err(done,'未成功调用err');
				test2(1,2).then(err(done),succ(2,done))
			})
			it('.then(succ,err) 异步函数执行 失败', function(done){
				xc = timeout_err(done,'未成功调用err');
				test2(1,2).then(err(done),succ(2,done))
			})

		})
		describe('.done 方法', function(){
			
			it('.done(succ) 同步函数执行 成功', function(done){
				xc = timeout_err(done,"未成功调用succ");
				fun1(1).done(succ(1,done))
			})
			it('.done(succ) 同步函数执行 失败', function(done){
				xc = timeout_succ(done);
				fun1(1,2).done(err(done))
			})
			it('.done(succ,err) 同步函数执行 成功', function(done){
				xc = timeout_err(done,"未成功调用succ");
				fun1(1).done(succ(1,done),err(done))
			})
			it('.done(succ,err) 同步函数执行 失败', function(done){
				xc = timeout_err(done,'未成功调用err');
				fun1(1,2).done(err(done),succ(2,done))
			})
			it('.done(succ) 异步函数执行 成功', function(done){
				xc = timeout_err(done,"未成功调用succ");
				test2(1).done(succ(1,done))
			})
			it('.done(succ) 异步函数执行 失败', function(done){
				xc = timeout_succ(done);
				test2(1,2).done(err(done))
			})
			it('.done(succ,err) 异步函数执行 成功', function(done){
				xc = timeout_err(done,'未成功调用err');
				test2(1).done(succ(1,done),err(done))
			})
			it('.done(succ,err) 异步函数执行 失败', function(done){
				xc = timeout_succ(done);
				test2(1,2).done(err(done),succ(2,done))
			})

		})
		describe('.fail 方法', function(){
	
			it('.fail(err) 同步函数执行 成功', function(done){
				xc = timeout_succ(done);
				fun1(1).fail(err(done))
			})
			it('.fail(err) 同步函数执行 失败', function(done){
				xc = timeout_err(done,"未成功调用err");
				fun1(1,2).fail(succ(2,done))
			})
			it('.fail(err) 异步函数执行 成功', function(done){
				xc = timeout_succ(done);
				fun1(1).fail(err(done))
			})
			it('.fail(err) 异步函数执行 失败', function(done){
				xc = timeout_err(done,"未成功调用err");
				fun1(1,2).fail(succ(2,done))
			})
			
		})
    })
});

/*

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

Qtest();  //正常工作测试

*/
