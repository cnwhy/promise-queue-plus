var assert = require("assert");
var QueueFun = require('../index');
var q = QueueFun.Q;
//var q_ = require('q')
var maxtime = 50

//同步函数
function fun1(i,err){
	var deferred = q.defer();
	if(err){
		deferred.reject(err)
	}else{
		deferred.resolve(i)
	}
	return deferred.promise;
}
//异步函数
function fun2(i,err){
	var deferred = q.defer();
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
			if(data !== k){
				return done("返回参数错误");
			}
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
describe('测试Queue-fun内部模拟q的异步函数类', function(){
	describe('实例化方法Promise函数',function(){
			it('q.defer() return q.promise', function(done){
				var obj = fun2(1)
				if(typeof obj.then == 'function'){
					done()
				}else{
					done("反回参数错误")
				}
			})
			it('q.Promise(callback) ', function(done){
				var callback = function(resolve,reject){
					setTimeout(function(){
						resolve(1)
					},maxtime)
				}
				q.Promise(callback).then(succ(1,done),err(done))
			})
			it('q(obj) >> value', function(done){
				q(1).then(succ(1,done),err(done))
			})
			it('q(obj) >> function >> reutrn', function(done){
				q(function(){
					return 1
				}).then(succ(1,done),err(done))
			})
			it('q(obj) >> function >> function', function(done){
				var fun = function(){return 1;}
				q(function(){
					return fun;
				}).then(succ(fun,done),err(done))
			})
			it('q(obj) >> function >> Likepromise >> throw', function(done){
				q(function(){
					var obj = {}
					obj.then = function(a,b){
						throw 1;
					}
					return obj;
				}).then(err(done),succ(1,done))
			})
			it('q(obj) >> function >> Likepromise >> resolve', function(done){
				q(function(){
					var obj = {}
					obj.then = function(a,b){
						a(1);
					}
					return obj;
				}).then(succ(1,done),err(done))
			})
			it('q(obj) >> function >> Likepromise >> reject', function(done){
				q(function(){
					var obj = {}
					obj.then = function(a,b){
						b(1);
					}
					return obj;
				}).then(err(done),succ(1,done))
			})
	})
	describe('单次调用测试', function(){
		describe('#then/when', function(){
			it('.then(succ) 同步函数执行 成功', function(done){
				var xc = timeout_err(done,"未成功调用succ");
				fun1(1).then(succ(1,done,xc))
			})
			it('.then(succ) 同步函数执行 失败', function(done){
				var xc = timeout_succ(done);
				fun1(1,2).then(err(done,xc))
			})
			it('.then(succ) 异步函数执行 成功', function(done){
				var xc = timeout_err(done,"未成功调用succ");
				fun2(1).then(succ(1,done,xc))
			})
			it('.then(succ) 异步函数执行 失败', function(done){
				var xc = timeout_succ(done);
				fun2(1,2).then(err(done,xc))
			})
			it('.then(succ,err) 同步函数执行 成功', function(done){
				var xc = timeout_err(done,"未成功调用succ");
				fun1(1).then(succ(1,done,xc),err(done,xc))
			})
			it('.then(succ,err) 同步函数执行 失败', function(done){
				var xc = timeout_err(done,'未成功调用err');
				fun1(1,2).then(err(done,xc),succ(2,done,xc))
			})
			it('.then(succ,err) 异步函数执行 成功', function(done){
				var xc = timeout_err(done,"未成功调用succ");
				fun2(1).then(succ(1,done,xc),err(done,xc))
			})
			it('.then(succ,err) 异步函数执行 失败', function(done){
				var xc = timeout_err(done,'未成功调用err');
				fun2(1,2).then(err(done,xc),succ(2,done,xc))
			})
		})
		describe('#done', function(){
			it('.done(succ) 成功', function(done){
				var xc = timeout_err(done,"未成功调用succ");
				fun2(1).done(succ(1,done,xc))
			})
			it('.done(succ,err) 成功', function(done){
				var xc = timeout_err(done,'未成功调用err');
				fun2(1).done(succ(1,done,xc),err(done,xc))
			})
			it('.done(succ,err) 失败', function(done){
				var xc = timeout_succ(done);
				fun2(1,2).done(err(done,xc),succ(2,done,xc))
			})
			it('.done(null,err) 成功', function(done){
				var xc = timeout_succ(done);
				fun2(1).done(null,err(done,xc))
			})
			it('.done(null,err) 失败', function(done){
				var xc = timeout_err(done,'未成功走完流程');
				fun2(1,2).done(null,succ(2,done,xc))
			})
		})
		describe('#fail/catch', function(){
			it('.fail(err) 成功', function(done){
				var xc = timeout_succ(done);
				fun2(1).fail(err(done,xc))
			})
			it('.fail(err) 失败', function(done){
				var xc = timeout_err(done,"未成功调用err");
				fun2(1,2).fail(succ(2,done,xc))
			})
		})
		describe('#fin/finally', function(){
			it('.finally() 成功后执行', function(done){
				var xc = timeout_err(done,"执行错误");
				var fin = 0;
				fun2(1).finally(function(){
					return fin = 1;
				}).then(function(data){
					if(fin !== 1) throw "执行错误";
					succ(1,done,xc)(data)
				},err(done,xc))
			})
			it('.finally() 失败后执行', function(done){
				var xc = timeout_err(done,"未成功调用err");
				var fin = 0;
				fun2(1,2).finally(function(){
					return fin = 1;
				}).then(err(done,xc),succ(2,done,xc))
			})
		})
    })
	describe('链式调用测试', function(){
		it('succ .then(null,null).then() ', function(done){
			fun2(1).then().then(succ(1,done),err(done,"错误调用"))
		})
		it('err .then(null,null).then() ', function(done){
			fun2(1,2).then().then(err(done,"错误调用"),succ(2,done))
		})
		it('.then(succ).then(succ) 1 > 1', function(done){
			var xc = timeout_err(done,'未成功走完流程');
			fun2(1).then(function(data){
				if(data !== 1) throw "返回参数错误";
				return fun1(1.1)
			}).then(succ(1.1,done,xc))
		})
		it('.then(succ).then(succ) 1 > 0', function(done){
			var xc = timeout_succ(done);
			fun2(2).then(function(data){
				if(data !== 2) throw "返回参数错误";
				return fun1(2.1,2.2)
			}).then(err(done,"错误调用"))
		})
		it('.then(succ).then(succ,err) 1 > 0', function(done){
			var xc = timeout_err(done,'未成功走完流程',2);
			fun2(2).then(function(data){
				if(data !== 2) throw "返回参数错误";
				return fun1(2.1,2.2)
			}).then(err(done,"错误调用"),succ(2.2,done,xc))
		})
		it('.then(succ).then(succ).fail(err) 1 > 0 > fail(err)', function(done){
			var xc = timeout_err(done,'未成功走完流程',2);
			fun2(3).then(function(data){
				if(data !== 3) throw "返回参数错误";
				return fun2(3.1,3.2)
			}).then(err(done,"错误调用")).fail(succ(3.2,done,xc))
		})
		it('.then(succ).then(succ,err).fail(err).then(succ) 1 > 0 > 1 > then()', function(done){
			var xc = timeout_err(done,'未成功走完流程',3);
			fun2(3).then(function(data){
				if(data !== 3) throw "返回参数错误";
				return fun2(3.1,3.2)
			}).then(err(done,"错误调用1"),function(err){
				if(err !== 3.2) throw "返回参数错误";
				return fun2(3.3)
			}).fail(err(done,"错误调用2")).then(succ(3.3,done,xc))
		})
		it('.then(succ).done(succ,err) 1 > 1 > done(succ,err)', function(done){
			var xc = timeout_err(done,'未成功走完流程',2);
			fun2(3).then(function(d){
				if(d !== 3) throw "返回参数错误";
				return fun1(3.1)
			}).done(succ(3.1,done,xc),err(done,"错误调用2",xc))
		})
		it('.then(succ).done(succ,err) 1 > 0 > done(succ,err)', function(done){
			var xc = timeout_err(done,'未成功走完流程',2);
			fun2(3).then(function(d){
				if(d !== 3) throw "返回参数错误";
				return fun1(3.1,3.2)
			}).done(err(done,"错误调用2",xc),succ(3.2,done,xc))
		})
		it('.then(succ,err).done(succ,err) 0 > 1 > done(succ,err)', function(done){
			var xc = timeout_err(done,'未成功走完流程',2);
			fun2(3,3.1).then(err(done,"错误调用1"),function(err){
				if(err !== 3.1) throw "返回参数错误";
				return fun1(3.2)
			}).done(succ(3.2,done,xc),err(done,"错误调用2",xc))
		})
		it('.then(succ).done(succ,err) 0 > 1 > done(succ,err)', function(done){
			var xc = timeout_err(done,'未成功走完流程',2);
			fun2(3,3.1).then(err(done,"错误调用1"))
			.done(err(done,"错误调用2",xc),succ(3.1,done,xc))
		})
		it('.then(succ).done() 0 > 1 > done(err)', function(done){
			var xc = timeout_err(done,'未成功走完流程',2);
			 try{
				fun2(3,3.1).then(err(done,"错误调用1")).done(err(done,"错误调用2"),succ(3.1,done,xc));
			}catch(e){
				console.log('1111111111222')
				clearTimeout(xc);
				done();
			}
		})
		it('.then(function).done()', function(done){
			var fun = function(){return 1;}
			fun2(1).then(function(){
				return fun;
			}).then(succ(fun,done),err(done,"错误调用"))
		})
		it('.then(Likepromise >> resolve).done()', function(done){
			var Likepromise = {}
			Likepromise.then = function(a,b){a(this.v+1)}
			fun2(1).then(function(k){
				Likepromise.v = k;
				return Likepromise
			}).then(succ(2,done),err(done,"错误调用"))
		})
		it('.then(Likepromise >> reject).done()', function(done){
			var Likepromise = {}
			Likepromise.then = function(a,b){b(this.v+1)}
			fun2(1).then(function(k){
				Likepromise.v = k;
				return Likepromise
			}).then(err(done,"错误调用"),succ(2,done))
		})
		it('.then(Likepromise >> throw err).done()', function(done){
			var Likepromise = {}
			Likepromise.then = function(v){throw "err"+this.v;}
			fun2(1).then(function(k){
				Likepromise.v = k;
				return Likepromise
			}).then(err(done,"错误调用"),succ("err1",done))
		})
		it('.then(succ,err) 1 > TypeError 测试', function(done){
			var xc = timeout_err(done,'未成功走完流程',2);
			var p = fun2(3)
			p.then(function(d){
				if(d !== 3) throw "返回参数错误";
				return p;
			},err(done,"错误调用",xc)).fail(succ("TypeError",done,xc))
		})
		it('.then(succ,err) 0 > TypeError 测试', function(done){
			var xc = timeout_err(done,'未成功走完流程',2);
			var p = fun2(3,3.1)
			p.then(err(done,"错误调用",xc),function(d){
				if(d !== 3.1) throw "返回参数错误";
				return p;
			}).fail(succ("TypeError",done,xc))
		})
	})
	describe('集成调用测试', function(){
		it('#all([promise,promise,promise])', function(done){
			var xc = timeout_err(done,'未成功走完流程',2);
			q.all([fun2(1),fun2(2),fun2(3)]).then(function(data){
				clearTimeout(xc);
				if(data.join(',') != "1,2,3") throw "返回参数错误"
				done() ;
			},err(done,"错误调用",xc))
		});
		it('#all(1,fun,promise)', function(done){
			var xc = timeout_err(done,'未成功走完流程',2);
			q.all([1,function(){return 2;},fun2(3)]).then(function(data){
				clearTimeout(xc);
				if(data.join(',') != "1,2,3") throw "返回参数错误"
				done() ;
			},err(done,"错误调用",xc))
		})
		it('#.spread number 成功', function(done){
			var xc = timeout_err(done,"未成功调用succ");
			fun2(1).spread(function(a){
				clearTimeout(xc);
				if(a===1){
					done();
				}else{
					throw "返回参数错误"
				}
			})
		})
		it('#.spread Arr 成功', function(done){
			var xc = timeout_err(done,"未成功调用succ");
			fun2([1,2,3]).spread(function(a,b,c){
				clearTimeout(xc);
				if(a==1&&b==2&&c==3){
					done();
				}else{
					throw "返回参数错误"
				}
			})
		})
		it('#all(promise,promise,promise).spread', function(done){
			var xc = timeout_err(done,'未成功走完流程',2);
			q.all([fun2(1),fun2(2),fun2(3)]).spread(function(a,b,c){
				clearTimeout(xc);
				if(a==1&&b==2&&c==3){
					done();
				}else{
					throw "返回参数错误"
				}
			},err(done,"错误调用",xc))
		})
		it('#any([promise,promise,promise]) succ',function(done){
			var xc = timeout_err(done,'未成功走完流程',2);
			var p1 = fun2(1),
				p2 = fun2(2);
			q.any([p1,p2]).then(function(data){
				clearTimeout(xc);
				if(data !== 1 && data !== 2) throw "返回参数错误"
				done() ;
			},err(done,"错误调用",xc))
		})
		it('#any([promise,promise,promise]) err',function(done){
			var xc = timeout_err(done,'未成功走完流程',2);
			var p1 = fun2(1,1),
				p2 = fun2(2,2);
			q.any([p1,p2]).then(err(done,"错误调用",xc),function(data){
				clearTimeout(xc);
				if(data !== 1 && data !== 2) throw "返回参数错误"
				done() ;
			})
		})
	})
	describe('扩展测试',function(){
		describe('test',function(){
			it('#Promise 状态测试', function(done){
				var deferred = q.defer();
				var deferred1 = q.defer();
				var status = ['pending','rejected','fulfilled']
				assert.equal(deferred.getState(),status[0],"初始化状态错误！")
				deferred.resolve(1);
				assert.equal(deferred.getState(),status[2],"装态转换错误！pending > fulfilled")
				deferred1.reject(new Error('test'));
				assert.equal(deferred1.getState(),status[1],"装态转换错误！pending > rejected")
				deferred.reject(new Error('test'));
				assert.equal(deferred.getState(),status[2],"装态转换规则错误！fulfilled")
				deferred1.resolve(1);
				assert.equal(deferred1.getState(),status[1],"装态转换规则错误！rejected")
				done();
			});
			it('#delay 延迟测试', function(done){
				var data1 = new Date(),cp = 1000;
				q.delay(cp).then(function(){
					if((Math.abs(new Date - data1) - cp) / cp > 0.1) return done("延迟误差过大！") 
					done();
				},err(done))
			});
		})
		describe('CPS 语法糖',function(){
			var FS = require("fs");
			it('#nfcall (promise风格化CPS)', function(done){
				q.nfcall(FS.readFile, __dirname + "/1.txt", "utf-8").then(succ('1.txt',done),err(done,"错误调用"));
			});
			// it('#nfcall (promise风格化CPS) call', function(done){
			// 	q.nfcall.call(console,console.log, __dirname + "/1.txt", "utf-8").then(succ('1.txt',done),err(done,"错误调用"));
			// });
			it('#nfapply (promise风格化CPS)', function(done){
				q.nfapply(FS.readFile, [__dirname + "/1.txt", "utf-8"]).then(succ('1.txt',done),err(done,"错误调用"));
			});
			it('#denodeify 封装CPS函数', function(done){
				var readFile = q.denodeify(FS.readFile);
				readFile(__dirname + "/1.txt", "utf-8").then(succ('1.txt',done),err(done,"错误调用"));
			});
		})
	})
});
