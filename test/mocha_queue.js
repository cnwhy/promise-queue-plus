var assert = require("assert");
var QueueFun = require('../index');
var q_ = QueueFun.Q;
var Queue = QueueFun.Queue();

var maxtime = 30

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

function ADD(queue,type,start){
	type = type || "";
	start = start || 0;
	var ts = type.split("|");
	var err = start <= 0,
		succ = start >= 0;
	var nostart;
	var i = 1;
	if(type == "nostart"){
		nostart = 1;
		type = "";
	}
	if(!type || ts.indexOf('push')){
		succ && queue.push(fun2,[i++]);
		err && queue.push(fun2,[i++,"push err"]);
	}
	if(!type || ts.indexOf('unshift')){
		succ && queue.unshift(fun2,[i++]);
		err && queue.unshift(fun2,[i++,"unshift err"]);
	}
	if(!nostart){
		if(!type || ts.indexOf('go')){
			succ && queue.go(fun2,[i++]);
			err && queue.go(fun2,[i++,"go err"]);
		}
		if(!type || ts.indexOf('jump')){
			succ && queue.jump(fun2,[i++]);
			err && queue.jump(fun2,[i++,"jump err"]);
		}
	}
	if(!type || ts.indexOf('all')){
		var arr = [];
		succ && arr.push([fun2,[i++]]);
		err && arr.push([fun2,[i++,"all err"]]);
		queue.all(arr);
	}
	if(!type || ts.indexOf('allLike')){
		var arr = [];
		succ && arr.push(i++);
		err && arr.push([i++,"allLike err"]);
		queue.allLike(arr,fun2)
	}
	if(!type || ts.indexOf('allEach')){
		var arr = [];
		succ && arr.push(i++);
		err && arr.push([i++,"allEach err"]);
		var fun_temp = function(v,i,arr){
			return fun2.apply(null,[].concat(v));
		}
		queue.allEach(arr,fun_temp)
	}
	if(!type || ts.indexOf('allMap')){
		var map = {};
		succ && (map.a = i++);
		err && (map.b = [i++,"allMap err"]);
		var fun_temp = function(v,k,map){
			return fun2.apply(null,[].concat(v));
		}
		queue.allMap(map,fun_temp)
	}
	return queue;
}

var succ = function(k,done,xc){
		return function(data){
			xc && clearTimeout(xc)
			if(data !== k) return done("返回参数错误");
			done();
		}
	}
	,err = function(done,xc,err){
		return function(err){
			xc && clearTimeout(xc)
			done(err || "调用错误");
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
    describe('使用非内置Promise', function(){
		it('#原生Promise', function(done){
			var q1 = new (QueueFun.Queue(Promise))(1);
			var funOk = function(){done();}
			if(q1.option("event_end") != funOk){
				q1.option("event_end",funOk)
			}
			ADD(q1,"",1)
		})
		it('#Q 模块', function(done){
			var q1 = new (QueueFun.Queue(require('q')))(1);
			q1.option("event_end",function(){done();})
			ADD(q1,"",1)
		})
    })
    describe('队列 插入，执行', function(){
		describe('#单个添加测试', function(){
			var q1 = new Queue(1)
			it('.push(fun,args,con) OK', function(done){
				q1.push(function(){
					throw "err";
				})
				q1.push(fun2,[1],{event_succ:succ(1,done)})
				q1.start();
			})
			it('.push(fun,args,con) err', function(done){
				q1.push(fun2,[1,2],{event_err:succ(2,done)})
				q1.start();
			})
			it('.push(fun,args)', function(done){
				q1.push(fun2,[1]).then(succ(1,done),err(done));
				q1.start();
			})
			it('.push(fun)', function(done){
				q1.push(function(){
					return fun2(1)
				}).then(succ(1,done),err(done));
				q1.start();
			})
			it('.push 添加 promise function', function(done){
				q1.push(fun2,[1,2]).then(err(done),function(err){
					if(err !== 2) done("返回参数错误");
				})
				q1.push(fun2,[1]).then(succ(1,done),err(done));
				q1.start();
			})
			it('.push 添加 not promise function', function(done){
				q1.push(function(){ throw 2; }).then(err(done),function(err){
					if(err !== 2) done("返回参数错误");
				})
				q1.push(function(){return 1;}).then(succ(1,done),err(done));
				q1.start();
			})
			it('.unshift 添加 promise function', function(done){
				q1.unshift(fun2,[1]).then(succ(1,done),err(done));
				q1.unshift(fun2,[1,2]).then(err(done),function(err){
					if(err !== 2) done("返回参数错误");
				})
				q1.start();
			})
			it('.unshift 添加 not promise function', function(done){
				q1.unshift(function(){return 1;}).then(succ(1,done),err(done));
				q1.unshift(function(){throw 2;}).then(err(done),function(err){
					if(err !== 2) done("返回参数错误");
				})
				q1.start();
			})
			it('.go 添加 promise function', function(done){
				q1.go(fun2,[1,2]).then(err(done),function(err){
					if(err !== 2) done("返回参数错误");
				})
				q1.go(fun2,[1]).then(succ(1,done),err(done));
			})
			it('.go 添加 not promise function', function(done){
				q1.go(function(){throw 2;}).then(err(done),function(err){
					if(err !== 2) done("返回参数错误");
				})
				q1.go(function(){return 1;}).then(succ(1,done),err(done));
			})
			it('.jump 添加 promise function', function(done){
				q1.jump(function(){throw 2;}).then(err(done),function(err){
					if(err !== 2) done("返回参数错误");
				})
				q1.jump(fun2,[1]).then(succ(1,done),err(done));
			})
			it('.jump 添加 not promise function', function(done){
				q1.jump(function(){throw 2;}).then(err(done),function(err){
					if(err !== 2) done("返回参数错误");
				})
				q1.jump(function(){return 1;}).then(succ(1,done),err(done));
			})
		})

		describe('#多个添加测试及执行', function(){
			var q1 = new Queue(1)
			var q2 = new Queue(3)
			it('.push 多个', function(done){
				var k = [],k1=[];
				q1.option("event_end",endfun)
				q2.option("event_end",endfun)
				for(var i = 0; i<5; i++){
					var _err = i===2 ? 2 : null;
					q1.push(fun2,[i,_err]).then(function(data){
						k.push(data)
					})
					q2.push(fun2,[i,_err]).then(function(data){
						k1.push(data)
					})
				}
				q1.start();
				q2.start();
				function endfun(){
					if(q1.isStart || q2.isStart) return;
					if(k.join('') !== '0134') return done("执行顺序错误");
					if(k1.join('') !== '0134') return done("多并发执行顺序错误");
					done();
				}
			})
			it('.unshift 多个', function(done){
				var k = [],k1=[];
				q1.option("event_end",endfun)
				q2.option("event_end",endfun)
				for(var i = 0; i<5; i++){
					var _err = i===2 ? 2 : null;
					q1.unshift(fun2,[i,_err]).then(function(data){
						k.push(data)
					})
					q2.unshift(fun2,[i,_err]).then(function(data){
						k1.push(data)
					})
				}
				q1.start();
				q2.start();
				function endfun(){
					if(q1.isStart || q2.isStart) return;
					if(k.join('') !== '4310') return done("执行顺序错误");
					if(k1.join('') !== '4310') return done("多并发执行顺序错误");
					done();
				}
			})
			it('.go 多个', function(done){
				var k = [],k1=[];
				q1.option("event_end",endfun)
				q2.option("event_end",endfun)
				for(var i = 0; i<5; i++){
					var _err = i===2 ? 2 : null;
					q1.go(fun2,[i,_err]).then(function(data){
						k.push(data)
					})
					q2.go(fun2,[i,_err]).then(function(data){
						k1.push(data)
					})
				}
				function endfun(){
					if(q1.isStart || q2.isStart) return;
					if(k.join('') !== '0134') return done("执行顺序错误");
					if(k1.join('') !== '0134') return done("多并发执行顺序错误");
					done();
				}
			})
			it('.jump 多个', function(done){
				var k = [],k1=[];
				q1.option("event_end",endfun)
				q2.option("event_end",endfun)
				for(var i = 0; i<5; i++){
					var _err = i===2 ? 2 : null;
					q1.jump(fun2,[i,_err]).then(function(data){
						k.push(data)
					})
					q2.jump(fun2,[i,_err]).then(function(data){
						k1.push(data)
					})
				}
				function endfun(){
					if(q1.isStart || q2.isStart) return;
					if(k.join('') !== '0431') return done("执行顺序错误");
					if(k1.join('') !== '0143') return done("多并发执行顺序错误");
					done();
				}
			})
		})

		describe('#批量添加测试', function(){
			var q1 = new Queue(1)
			var q2 = new Queue(3)
			it('.all([[fun,arg,con]],start,jump) all ok', function(done){
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
				},err(done))
			})
			it('.all([[fun,arg,con]],start,jump) 2 > err', function(done){
				var k = [],k1=[];
				var arr = [
					[fun2,[0]],
					[fun2,[1]],
					[fun2,[2,2]],
					[fun2,[3]],
					[fun2,[4]]
				]
				q2.all(arr,1).then(err(done),succ(2,done))
			})
			it('.allLike([arg1,arg2],fun,con,start,jump) all ok', function(done){
				var k = [],k1=[];
				var arr = [0,1,2,3,4]
				q2.allLike(arr,fun2,1).then(function(data){
					if(data.join('') !== '01234')return done("返回错误");
					done();
				},err(done))
			})
			it('.allLike([arg1,arg2],fun,con,start,jump) 2 > err', function(done){
				var k = [],k1=[];
				var arr = [0,1,[2,2],3,4]
				q2.allLike(arr,fun2,{},1).then(err(done),succ(2,done))
			})
			it('.allEach([arg1,arg2],fun,con,start,jump) all ok', function(done){
				var k = [],k1=[];
				var arr = [0,1,2,3,4]
				function fun_temp(v,i,arr){
					return fun2(v);
				}
				q2.allEach(arr,fun_temp,{},1).then(function(data){
					if(data.join('') !== '01234') return done("返回错误");
					done();
				},err(done))
			})
			it('.allEach([arg1,arg2],fun,con,start,jump) 2 > err', function(done){
				var k = [],k1=[];
				var arr = [0,1,2,3,4]
				function fun_temp(v,i,arr){
					var _err = v == 2 ? 2 : null;
					return fun2(v,_err);
				}
				q2.allEach(arr,fun_temp,1).then(err(done),succ(2,done))
			})
			it('.allMap(map,fun,con,start,jump) all > ok', function(done){
				var k = [],k1=[];
				var map = {a:1,b:2,c:3}
				function fun_temp(v,i,map){
					return fun2(v);
				}
				q2.allMap(map,fun_temp,1).then(function(data){
					if(data.a !== 1 || data.b !== 2 || data.c !== 3) return done("返回错误");
					done();
				},err(done))
			})
			it('.allMap(map,fun,con,start,jump) all > b > err', function(done){
				var k = [],k1=[];
				var map = {a:1,b:2,c:3}
				function fun_temp(v,i,map){
					var _err = v == 2 ? i : null;
					return fun2(v,_err);
				}
				q2.allMap(map,fun_temp,{},1).then(err(done),succ('b',done))
			})
		})
    })
	describe('队列方法测试', function(){
		describe('#队列控制测试', function(){
			var q1 = new Queue(1)
			it('.start()', function(done){
				var p = q1.push(fun2,[1]);
				q1.start();
				setTimeout(function(){
					p.then(succ(1,done))
				},maxtime*1.1)
			})
			it('.stop()', function(done){
				var k =  [];
				for(var i = 0; i < 5; i++ ){
					q1.push(fun2,[i]).then(function(data){
						k.push(data)
					})
				}
				q1.start();
				q1.stop();
				setTimeout(function(){
					//console.log(k)
					if(k.join('') !== "0") return done("暂停失败！")
					q1.start();
					q1.option("event_end",function(){
						if(k.join('') !== "01234") return done("恢复执行出现问题！")
						done();
					})
				},maxtime*2.1)
			})
			it('.clear()', function(done){
				var k =  [],ke = [];
				q1.option("event_end",null);
				for(var i = 0; i < 5; i++ ){
					q1.push(fun2,[i]).then(function(data){
						k.push(data)
					},function(err){
						ke.push(err)
					})
				}
				q1.start()
				q1.clear(2);
				setTimeout(function(){
					if(k.join('') !== "0" || ke.join('') !== "2222") return done("清除执行时出现问题！")
					done();
				},maxtime*2.1);
			})
			it('.setMax()', function(done){
				var k =  [],ke = [];
				for(var i = 0; i < 100; i++ ){
					q1.push(fun2,[i]).then(function(data){
						k.push(data)
					},function(err){
						ke.push(err)
					})
				}
				q1.start()
				q1.setMax(100)
				setTimeout(function(){
					//console.log(k.join()) // 0 - 99
					if(k.length < 100) return done("清除执行时出现问题！")
					done();
				},maxtime*1.1)
			})
		})
		describe('#队列事件测试', function(){
			// var q1 = new Queue(1,{
			// 	"event_succ":function(){console.log(this,arguments)}  //成功
			// 	,"event_err":function(){}  //失败
			// 	,"event_begin":function(){}  //队列开始
			// 	,"event_end":function(){}    //队列完成
			// 	,"event_add":function(){}    //有执行项添加进执行单元后执行
			// })

			it('#event_begin , event_end 事件', function(done){
				var q1 = new Queue(1);
				var begin;
				q1.option("event_begin",function(){
					begin = 1;
				});
				q1.option("event_end",function(){
					if(begin) done();
				});
				ADD(q1,"nostart");
				setTimeout(function(){q1.start()},50)
			})
			it('#event_succ , event_err 事件', function(done){
				var q1 = new Queue(1)
				q1.option("event_succ",function(v,Qobj){
					if(typeof v != 'number') return done("event_succ 反回错误！")
				})
				q1.option("event_err",function(err,Qobj){
					if(!/\serr$/.test(err)) return done("event_err 反回错误！")
				})
				q1.option("event_end",function(){
					done();
				})	
				ADD(q1).start();
			})
		})
		describe('#重试与超时', function(){
			it('#重试 默认', function(done){
				var q1 = new Queue(2,{
					"retryNo":5
					,"retryType":0               //重试模式  0:搁置执行(插入队列尾部重试),1:优先执行 (插入队列头部重试)
				})
				var rnumb = 0,rnumb1 = 0;
				q1.option("event_end",function(){
					if(rnumb == 0 || rnumb1 == 0) return done("未重试")
					if(rnumb !== 5 || rnumb1 !== 5) return done("重试次数错误！")
					done();
				})
				q1.go(function(){
					rnumb++;
					if(rnumb<5) throw "err"
					return 1;
				})
				q1.go(function(){
					rnumb1++;
					if(rnumb1<5) throw "err"
					return 1;
				})
			})
			it('#重试 优先', function(done){
				var q1 = new Queue(1,{
					"retryNo":5
					,"retryType":1 //重试模式  0:搁置执行(插入队列尾部重试),1:优先执行 (插入队列头部重试)
				})
				var rnumb = 0,rnumb1 = 0;
				q1.go(function(){
					var def = q_.defer()
					setTimeout(function(){
						rnumb++;
						if(rnumb<5) def.reject("err");
						else def.resolve(1);
					},20)
					return def.promise;
				})
				q1.go(function(){
					return rnumb
				}).then(succ(5,done),err(done))
			})
			it('#超时 ', function(done){
				var q1 = new Queue(2,{
					"timeout":100
				})
				q1.go(function(){
					var def = q_.defer();
					setTimeout(function(){
						def.resolve("OK")
					},200)
					return def.promise;
				}).then(err(done),succ("timeout",done))
				//}).then(function(d){console.log("d:",d)},function(e){console.log("e:",e)})
			})
			it('#超时 单独自定义', function(done){
				var q1 = new Queue(2,{
					"timeout":100
				})
				q1.go(function(){
					var def = q_.defer();
					setTimeout(function(){
						def.resolve("OK")
					},200)
					return def.promise;
				},{timeout:300}).then(succ("OK",done),err(done))
			})
		})
	})
});
