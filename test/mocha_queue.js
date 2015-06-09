var assert = require("assert");
var QueueFun = require('../index');
var qq = require('q')
var q_ = QueueFun.Q;
var Queue = QueueFun.Queue();

var maxtime = 50

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
function fun2(i,err){
	var deferred = q_.defer();
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

var succ = function(k,done,xc){
		return function(data){
			xc && clearTimeout(xc)
			if(data !== k) return done("返回参数错误");
			done();
		}
	}
	,err = function(done,xc){
		return function(err){
			xc && clearTimeout(xc)
			done("回调错误");
		}
	}
	,timeout_succ = function(done,c){
		c = c ? c : 1;
		return setTimeout(function(){
				done();
			},(maxtime+100)*c)
	}
	,timeout_err = function(done,errmsg,c){
		c = c ? c : 1;
		return setTimeout(function(){
				done(errmsg);
			},(maxtime+100)*c)
	}

//普通测试
describe('测试Queue-fun Queue 队列类', function(){
    describe('单次调用测试', function(){
		describe('#单个添加测试', function(){
			var q1 = new Queue(1)
			it('.push 添加 promise function', function(done){
				q1.push(fun2,[1,2]).then(err(done,"调用错误"),function(err){
					if(err !== 2) done("返回参数错误");
				})
				q1.push(fun2,[1]).then(succ(1,done),err(done,"调用错误"));
				q1.start();
			})
			it('.push 添加 not promise function', function(done){
				q1.push(function(){ throw 2; }).then(err(done,"调用错误"),function(err){
					if(err !== 2) done("返回参数错误");
				})
				q1.push(function(){return 1;}).then(succ(1,done),err(done,"调用错误"));
				q1.start();
			})
			it('.unshift 添加 promise function', function(done){
				q1.unshift(fun2,[1]).then(succ(1,done),err(done,"调用错误"));
				q1.unshift(fun2,[1,2]).then(err(done,"调用错误"),function(err){
					if(err !== 2) done("返回参数错误");
				})
				q1.start();
			})
			it('.unshift 添加 not promise function', function(done){
				q1.unshift(function(){return 1;}).then(succ(1,done),err(done,"调用错误"));
				q1.unshift(function(){throw 2;}).then(err(done,"调用错误"),function(err){
					if(err !== 2) done("返回参数错误");
				})
				q1.start();
			})
			it('.go 添加 promise function', function(done){
				q1.go(fun2,[1,2]).then(err(done,"调用错误"),function(err){
					if(err !== 2) done("返回参数错误");
				})
				q1.go(fun2,[1]).then(succ(1,done),err(done,"调用错误"));
			})
			it('.go 添加 not promise function', function(done){
				q1.go(function(){throw 2;}).then(err(done,"调用错误"),function(err){
					if(err !== 2) done("返回参数错误");
				})
				q1.go(function(){return 1;}).then(succ(1,done),err(done,"调用错误"));
			})
			it('.jump 添加 promise function', function(done){
				q1.jump(function(){throw 2;}).then(err(done,"调用错误"),function(err){
					if(err !== 2) done("返回参数错误");
				})
				q1.jump(fun2,[1]).then(succ(1,done),err(done,"调用错误"));
			})
			it('.jump 添加 not promise function', function(done){
				q1.jump(function(){throw 2;}).then(err(done,"调用错误"),function(err){
					if(err !== 2) done("返回参数错误");
				})
				q1.jump(function(){return 1;}).then(succ(1,done),err(done,"调用错误"));
			})
		})
		describe('#多个添加测试', function(){
			var q1 = new Queue(1)
			var q2 = new Queue(3)
			it('.push 添加 多个', function(done){
				var k = [],k1=[];
				for(var i = 0; i<5; i++){
					q1.push(fun2,[i]).then(function(data){
						k.push(data)
					})
					q2.push(fun2,[i]).then(function(data){
						k1.push(data)
					})
				}
				q1.start();
				q2.start();
				setTimeout(function(){
					if(k.join('') !== '01234') return done("执行顺序错误");
					if(k1.join('') !== '01234') return done("多并发执行顺序错误");
					done()
				},300)
			})
			it('.unshift ', function(done){
				var k = [],k1=[];
				for(var i = 0; i<5; i++){
					q1.unshift(fun2,[i]).then(function(data){
						k.push(data)
					})
					q2.unshift(fun2,[i]).then(function(data){
						k1.push(data)
					})
				}
				q1.start();
				q2.start();
				setTimeout(function(){
					if(k.join('') !== '43210') return done("执行顺序错误");
					if(k1.join('') !== '43210') return done("多并发执行顺序错误");
					done();
				},300)
			})
			it('.go ', function(done){
				var k = [],k1=[];
				for(var i = 0; i<5; i++){
					var p = q1.go(fun2,[i]).then(function(data){
						k.push(data)
					})
					if(i==4){
						p.then(function(){
							if(k.join('') !== '01234') return done("执行顺序错误");
							done();
						})
					}
				}
			})
			it('.jump ', function(done){
				var k = [],k2=[];
				for(var i = 0; i<5; i++){
					var p = q1.jump(fun2,[i]).then(function(data){
						k.push(data)
					})
					var p2 = q2.jump(fun2,[i]).then(function(data){
						k2.push(data)
					})
				}
				setTimeout(function(){
					if(k.join('') !== '04321') return done("执行顺序错误");
					if(k2.join('') !== '01243') return done("多并发执行顺序错误");
					done();
				},300)
			})
		})
		describe('#批量添加测试', function(){
			var q1 = new Queue(1)
			var q2 = new Queue(3)
			it('.all([[fun,arg,con]],start,jump) 添加', function(done){
				var k = [],k1=[];
				var arr = [
					[fun2,[0]],
					[fun2,[1]],
					[fun2,[2]],
					[fun2,[3]],
					[fun2,[4]]
				]
				q2.all(arr,1).then(function(data){
					if(data.join('') !== '01234') return done("返回错误");
					done();
				})
			})
			it('.allLike([arg1,arg2],fun,con,start,jump) ', function(done){
				var k = [],k1=[];
				var arr = [0,1,2,3,4]
				q2.allLike(arr,fun2,1).then(function(data){
					if(data.join('') !== '01234')return done("返回错误");
					done();
				},err(done,"调用错误"))
			})
			it('.allEach([arg1,arg2],fun,con,start,jump) ', function(done){
				var k = [],k1=[];
				var arr = [0,1,2,3,4]
				function fun_temp(v,i,arr){
					return fun2(v);
				}
				q2.allEach(arr,fun_temp,1).then(function(data){
					if(data.join('') !== '01234') return done("返回错误");
					done();
				},err(done,"调用错误"))
			})
		})
    })
	describe('队列方法测试', function(){
		describe('#队列控制测试', function(){
			it('.start()', function(done){
				done()
			})
			it('.stop()', function(done){
				done()
			})
			it('.clear()', function(done){
				done()
			})
			it('.setMax()', function(done){
				done()
			})
		})
	})
});
