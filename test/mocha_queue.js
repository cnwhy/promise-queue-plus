var assert = require("assert");
var Queue = require('../index');
var Q = Queue.Q;
var MAXTIME = 30
var NULLFUN = function () {};

//同步函数
function fun1(i, err) {
	var deferred = Q.defer();
	if (err) {
		deferred.reject(err)
	} else {
		deferred.resolve(i)
	}
	return deferred.promise;
}

//异步函数
function fun2(i, err) {
	var deferred = Q.defer();
	setTimeout(function () {
		if (err) {
			deferred.reject(err)
		} else {
			deferred.resolve(i)
		}
	}, MAXTIME)
	//},(Math.random() * MAXTIME)>>0)
	return deferred.promise;
}

function fun2_p(i, err) {
	return function (resolve, reject) {
		setTimeout(function () {
			if (err) {
				reject(err)
			} else {
				resolve(i)
			}
		}, MAXTIME)
	}
}


function fun3() {
	return fun2.apply(null, arguments)
}

function fun4(v, i, all) {
	if (all[i] !== v) throw ("执行参数错误!");
	return fun2.apply(null, [].concat(v))
}

function ADD(queue, type, start) {
	type = type || "";
	start = start || 0;
	var ts = type.split("|");
	var err = start <= 0,
		succ = start >= 0;
	var nostart;
	var i = 1;
	if (type == "nostart") {
		nostart = 1;
		type = "";
	}
	if (!type || ~ts.indexOf('push')) {
		succ && queue.push(fun2, [i++]);
		err && queue.push(fun2, [i++, "push err"]).then(null, NULLFUN);
	}
	if (!type || ~ts.indexOf('unshift')) {
		succ && queue.unshift(fun2, [i++]);
		err && queue.unshift(fun2, [i++, "unshift err"]).then(null, NULLFUN);
	}
	if (!nostart) {
		if (!type || ~ts.indexOf('go')) {
			succ && queue.go(fun2, [i++]);
			err && queue.go(fun2, [i++, "go err"]).then(null, NULLFUN);
		}
		if (!type || ~ts.indexOf('jump')) {
			succ && queue.jump(fun2, [i++]);
			err && queue.jump(fun2, [i++, "jump err"]).then(null, NULLFUN);
		}
	}
	if (!type || ~ts.indexOf('addArray')) {
		var arr = [];
		succ && arr.push([fun2, [i++]]);
		err && arr.push([fun2, [i++, "addArray err"]]);
		queue.addArray(arr).then(null, NULLFUN);
	}
	if (!type || ~ts.indexOf('addLikeArray')) {
		var arr = [];
		succ && arr.push(i++);
		err && arr.push([i++, "addLikeArray err"]);
		queue.addLikeArray(arr, fun3).then(null, NULLFUN);
	}
	if (!type || ~ts.indexOf('addLikeArrayEach')) {
		var arr = [];
		succ && arr.push(i++);
		err && arr.push([i++, "addLikeArrayEach err"]);
		var fun_temp = function (v, i, arr) {
			return fun2.apply(null, [].concat(v));
		}
		queue.addLikePropsEach(arr, fun_temp)
	}
	if (!type || ~ts.indexOf('addLikePropsEach')) {
		var map = {};
		succ && (map.a = i++);
		err && (map.b = [i++, "addLikePropsEach err"]);
		var fun_temp = function (v, k, map) {
			return fun2.apply(null, [].concat(v));
		}
		queue.addLikePropsEach(map, fun_temp)
	}
	return queue;
}

var succ = function (k, done, xc) {
		return function (data) {
			xc && clearTimeout(xc)
			if (data !== k) return done("返回参数错误");
			done();
		}
	},
	err = function (done, xc, err) {
		return function (err) {
			xc && clearTimeout(xc)
			done(err || "调用错误");
		}
	},
	timeout_succ = function (done, c) {
		c = c ? c : 1;
		return setTimeout(function () {
			done();
		}, (MAXTIME + 100) * c)
	},
	timeout_err = function (done, errmsg, c) {
		c = c ? c : 1;
		return setTimeout(function () {
			done(errmsg);
		}, (MAXTIME + 100) * c)
	}

var addnoFun = function (queue, type) {
	var noFuns = [null, undefined, NaN, 0, 1, "", "a", {
			a: 1
		},
		[1, 2, 3], /abc/
	]
	type = type || "";
	var ts = type.split("|");
	var errs = [];
	if (!type || ~ts.indexOf('push')) {
		noFuns.forEach(function (v, i) {
			try {
				queue.push(v);
			} catch (e) {
				errs.push(e)
			}
		})
	}
	if (!type || ~ts.indexOf('unshift')) {
		noFuns.forEach(function (v, i) {
			try {
				queue.unshift(v);
			} catch (e) {
				errs.push(e)
			}
		})
	}
	if (!type || ~ts.indexOf('go')) {
		noFuns.forEach(function (v, i) {
			try {
				queue.go(v);
			} catch (e) {
				errs.push(e)
			}
		})
	}
	if (!type || ~ts.indexOf('jump')) {
		noFuns.forEach(function (v, i) {
			try {
				queue.jump(v);
			} catch (e) {
				errs.push(e)
			}
		})
	}
	if (!type || ~ts.indexOf('add')) {
		noFuns.forEach(function (v, i) {
			try {
				queue.add(v);
			} catch (e) {
				errs.push(e)
			}
		})
	}
	return errs;
}

function testDescriby(event_name) {
	var td = {
		"false": {
			value: false,
			succ_value: false
		},
		"true": {
			value: true,
			succ_value: true
		},
		"1": {
			value: 1,
			succ_value: true
		},
		"0": {
			value: 0,
			succ_value: false
		},
		"null": {
			value: null,
			succ_value: false
		},
		"undefined": {
			value: undefined,
			succ_value: false
		},
		"function > false": {
			value: function () {
				return false;
			},
			succ_value: false
		},
		"function > true": {
			value: function () {
				return true;
			},
			succ_value: true
		},
		"function > undefined": {
			value: function () {},
			succ_value: true
		},
		"function > throw": {
			value: function () {
				throw "err";
			},
			succ_value: true
		}
	}
	for (var test in td) {
		+ function () {
			var ts = test
			var t = td[ts];
			it("进行" + event_name + "值为: " + ts + " 的测试", function (done) {
				testEvent(event_name, t.value, t.succ_value, done);
			})
		}()
		//break;
	}
}

function testEvent(event_name, event, succ_value, done) {
	var testData = {
		"workResolve": [],
		"workReject": [],
		"workFinally": []
	};
	var arr = testData[event_name];
	var dfon = {
		"workResolve": 'y',
		"workReject": 'n',
		"workFinally": 'f'
	}
	var push = function (vname, i) {
		return function (k) {
			testData[vname] && testData[vname].push(i);
		}
	}
	var q1 = new Queue(1, {
		"workResolve": push("workResolve", 'y'),
		"workReject": push("workReject", 'n'),
		"workFinally": push("workFinally", 'f'),
		"queueEnd": function (vv, Qobj) {
			// console.log(event_name,event,succ_value)
			// console.log(arr)
			// console.log(v)
			if (succ_value) {
				if (arr.join("") != v) return done("逻辑错误!" + arr)
			} else {
				if (arr.join("") != "") return done("逻辑错误!" + arr)
			}
			done();
		}
	});
	q1.onError = function () {};
	var con = {},
		v;
	con[event_name] = event;
	v = dfon[event_name];
	if (event_name == 'workFinally') {
		v += v;
	}
	q1.push(fun2, [9], con); //yf
	q1.push(fun2, [9, 9], con).then(null, NULLFUN); //nf
	q1.start();
}

//普通测试
describe('测试Queue', function () {
	describe('队列 插入，执行', function () {
		describe('#单个添加测试', function () {
			var q1 = new Queue(1)
			it('插入非函数报错', function (done) {
				var errs = addnoFun(q1);
				if (errs.length != 50) {
					return done("错误数目不对");
				}
				for (var i = 0; i < errs.length; i++) {
					var e = errs[i];
					if (!(e instanceof TypeError && e.message.indexOf("Queues only support function") == 0)) {
						return done("错误信息不对")
					}
				}
				done();
			})
			it('.push(fun,args,con) OK', function (done) {
				q1.push(fun2, [1], {
					workResolve: succ(1, done)
				})
				q1.start();
			})
			it('.push(fun,args,con) err', function (done) {
				q1.push(fun2, [1, 2], {
					workReject: succ(2, done)
				}).then(null, NULLFUN)
				q1.start();
			})
			it('.push(fun,args)', function (done) {
				q1.push(fun2, [1]).then(succ(1, done), err(done));
				q1.start();
			})
			it('.push(fun)', function (done) {
				q1.push(function () {
					return fun2(1)
				}).then(succ(1, done), err(done));
				q1.start();
			})
			it('.push 添加 promise function', function (done) {
				q1.push(fun2, [1, 2]).then(err(done), function (err) {
					if (err !== 2) done("返回参数错误");
				})
				q1.push(fun2, [1]).then(succ(1, done), err(done));
				q1.start();
			})
			it('.push 添加 not promise function', function (done) {
				q1.push(function () {
					throw 2;
				}).then(err(done), function (err) {
					if (err !== 2) done("返回参数错误");
				})
				q1.push(function () {
					return 1;
				}).then(succ(1, done), err(done));
				q1.start();
			})
			it('.unshift 添加 promise function', function (done) {
				q1.unshift(fun2, [1]).then(succ(1, done), err(done));
				q1.unshift(fun2, [1, 2]).then(err(done), function (err) {
					if (err !== 2) done("返回参数错误");
				})
				q1.start();
			})
			it('.unshift 添加 not promise function', function (done) {
				q1.unshift(function () {
					return 1;
				}).then(succ(1, done), err(done));
				q1.unshift(function () {
					throw 2;
				}).then(err(done), function (err) {
					if (err !== 2) done("返回参数错误");
				})
				q1.start();
			})
			it('.go 添加 promise function', function (done) {
				q1.go(fun2, [1, 2]).then(err(done), function (err) {
					if (err !== 2) done("返回参数错误");
				})
				q1.go(fun2, [1]).then(succ(1, done), err(done));
			})
			it('.go 添加 not promise function', function (done) {
				q1.go(function () {
					throw 2;
				}).then(err(done), function (err) {
					if (err !== 2) done("返回参数错误");
				})
				q1.go(function () {
					return 1;
				}).then(succ(1, done), err(done));
			})
			it('.jump 添加 promise function', function (done) {
				q1.jump(function () {
					throw 2;
				}).then(err(done), function (err) {
					if (err !== 2) done("返回参数错误");
				})
				q1.jump(fun2, [1]).then(succ(1, done), err(done));
			})
			it('.jump 添加 not promise function', function (done) {
				q1.jump(function () {
					throw 2;
				}).then(err(done), function (err) {
					if (err !== 2) done("返回参数错误");
				})
				q1.jump(function () {
					return 1;
				}).then(succ(1, done), err(done));
			})
			it('.add resolve value', function (done) {
				q1.add(function (resolve, reject) {
					resolve(1)
				}, true).then(succ(1, done), err(done));
			})
			it('.add resolve value 异步', function (done) {
				q1.add(function (resolve, reject) {
					setTimeout(function () {
						resolve(1)
					}, 0)
				}, true).then(succ(1, done), err(done));
			})
			it('.add resolve promise succ', function (done) {
				q1.add(function (resolve, reject) {
					resolve(fun2(1))
				}, true).then(succ(1, done), err(done));
			})
			it('.add resolve promise err', function (done) {
				q1.add(function (resolve, reject) {
					resolve(fun2(1, 2))
				}, true).then(err(done), succ(2, done));
			})
			it('.add throw', function (done) {
				q1.add(function (resolve, reject) {
					throw 2;
				}, true).then(err(done), succ(2, done))
			})
			it('.add reject', function (done) {
				q1.add(function (resolve, reject) {
					reject(2);
				}, true).then(err(done), succ(2, done))
			})
			it('.add reject 异步', function (done) {
				q1.add(function (resolve, reject) {
					setTimeout(function () {
						reject(2);
					}, 0)
				}, true).then(err(done), succ(2, done))
			})
		})

		describe('#多个添加测试及执行', function () {
			var q1 = new Queue(1)
			var q2 = new Queue(3)
			it('.push 多个', function (done) {
				var k = [],
					k1 = [];
				q1.option("queueEnd", endfun)
				q2.option("queueEnd", endfun)
				for (var i = 0; i < 5; i++) {
					var _err = i === 2 ? 2 : null;
					q1.push(fun2, [i, _err]).then(function (data) {
						k.push(data)
					}, NULLFUN)
					q2.push(fun2, [i, _err]).then(function (data) {
						k1.push(data)
					}, NULLFUN)
				}
				q1.start();
				q2.start();

				function endfun() {
					if (q1.isStart() || q2.isStart()) return;
					if (k.join('') !== '0134') return done("执行顺序错误" + k.join(''));
					if (k1.join('') !== '0134') return done("多并发执行顺序错误" + k1.join(''));
					done();
				}
			})
			it('.unshift 多个', function (done) {
				var k = [],
					k1 = [];
				q1.option("queueEnd", endfun)
				q2.option("queueEnd", endfun)
				for (var i = 0; i < 5; i++) {
					var _err = i === 2 ? 2 : null;
					q1.unshift(fun2, [i, _err]).then(function (data) {
						k.push(data)
					}, NULLFUN)
					q2.unshift(fun2, [i, _err]).then(function (data) {
						k1.push(data)
					}, NULLFUN)
				}
				q1.start();
				q2.start();

				function endfun() {
					if (q1.isStart() || q2.isStart()) return;
					if (k.join('') !== '4310') return done("执行顺序错误");
					if (k1.join('') !== '4310') return done("多并发执行顺序错误");
					done();
				}
			})
			it('.go 多个', function (done) {
				var k = [],
					k1 = [];
				q1.option("queueEnd", endfun)
				q2.option("queueEnd", endfun)
				for (var i = 0; i < 5; i++) {
					var _err = i === 2 ? 2 : null;
					q1.go(fun2, [i, _err]).then(function (data) {
						k.push(data)
					}, NULLFUN)
					q2.go(fun2, [i, _err]).then(function (data) {
						k1.push(data)
					}, NULLFUN)
				}

				function endfun() {
					if (q1.isStart() || q2.isStart()) return;
					if (k.join('') !== '0134') return done("执行顺序错误");
					if (k1.join('') !== '0134') return done("多并发执行顺序错误");
					done();
				}
			})
			it('.jump 多个', function (done) {
				var k = [],
					k1 = [];
				q1.option("queueEnd", endfun)
				q2.option("queueEnd", endfun)
				for (var i = 0; i < 5; i++) {
					var _err = i === 2 ? 2 : null;
					q1.jump(fun2, [i, _err]).then(function (data) {
						k.push(data)
					}, NULLFUN)
					q2.jump(fun2, [i, _err]).then(function (data) {
						k1.push(data)
					}, NULLFUN)
				}

				function endfun() {
					if (q1.isStart() || q2.isStart()) return;
					if (k.join('') !== '0431') return done("执行顺序错误");
					if (k1.join('') !== '0143') return done("多并发执行顺序错误" + k1.join(""));
					done();
				}
			})
			it('.add 多个', function (done) {
				var k = [],
					k1 = [];
				q1.option("queueEnd", endfun)
				q2.option("queueEnd", endfun)
				for (var i = 0; i < 5; i++) {
					var _err = i === 2 ? 2 : null;
					q1.add(fun2_p(i, _err)).then(function (data) {
						k.push(data)
					}, NULLFUN)
					q2.add(fun2_p(i, _err),{
						
					}, false, true).then(function (data) {
						k1.push(data)
					}, NULLFUN)
				}
				q1.start();
				q2.start();

				function endfun() {
					if (q1.isStart() || q2.isStart()) return;
					if (k.join('') !== '0134') return done("执行顺序错误" + k.join(''));
					if (k1.join('') !== '4310') return done("多并发执行顺序错误" + k1.join(''));
					done();
				}
			})
		})

		describe('#批量添加测试', function () {
			var q1 = new Queue(1)
			var q2 = new Queue(3)
			it('.addArray([[fun,arg,con]],start,jump) all ok', function (done) {
				var k = [],
					k1 = [],
					jump;
				var arr = [
					[fun2, [0]],
					[fun2, [1]],
					[fun2, [2]]
				]
				q1.addArray(arr, 1).then(function (data) {
					if (data.join('') !== '012') return done("返回错误");
					done();
				}, err(done))
				q1.jump(fun2, [1]).then(function () {
					jump = 1;
				})
				q1.addArray(arr, 1, 1).then(function (data) {
					if (jump) return done("优先执行出错");
					if (data.join('') !== '012') return done("返回错误");
				}, err(done))
			})
			it('.addArray([[fun,arg,con]],start,jump) 2 > err', function (done) {
				var k = [],
					k1 = [];
				var arr = [
					[fun2, [0]],
					[fun2, [1]],
					[fun2, [2, 2]]
				]
				q2.addArray(arr, 1, 1).then(err(done), succ(2, done))
			})
			it('.addProps(map,start,jump) all ok', function (done) {
				var k = [],
					k1 = [],
					jump;
				var map = {
					a: [fun2, [1]],
					b: [fun2, [2]],
					c: [fun2, [3]]
				}
				q1.addProps(map, 1).then(function (data) {
					if (data.a !== 1 || data.b !== 2 || data.c !== 3) return done("返回错误");
					done();
				}, err(done))
				q1.jump(fun2, [1]).then(function () {
					jump = 1;
				})
				q1.addProps(map, 1, 1).then(function (data) {
					if (jump) return done("优先执行出错");
					if (data.a !== 1 || data.b !== 2 || data.c !== 3) return done("返回错误");
				}, err(done))
			})
			it('.addProps(map,start,jump) all err', function (done) {
				var k = [],
					k1 = [],
					jump;
				var map = {
					a: [fun2, [1]],
					b: [fun2, [2, 2]],
					c: [fun2, [3]]
				}
				q2.addProps(map, 1, 1).then(err(done), succ(2, done))
			})
			it('.addLikeArray([arg1,arg2],fun,con,start,jump) all ok', function (done) {
				var k = [],
					k1 = [],
					jump;
				var arr = [0, 1, [2]]
				q1.addLikeArray(arr, fun3, 1).then(function (data) {
					if (data.join('') !== '012') return done("返回错误");
					done();
				}, err(done))
				q1.jump(fun2, [1]).then(function () {
					jump = 1;
				})
				q1.addLikeArray(arr, fun3, 1, 1).then(function (data) {
					if (jump) return done("优先执行出错");
					if (data.join('') !== '012') return done("返回错误");
				}, err(done))
			})
			it('.addLikeArray([arg1,arg2],fun,con,start,jump) 2 > err', function (done) {
				var k = [],
					k1 = [];
				var arr = [0, 1, [2, 2], 3, 4]
				q2.addLikeArray(arr, fun3, {}, 1).then(err(done), succ(2, done))
			})
			it('.addLikeArrayEach([arg1,arg2],fun,con,start,jump) all ok', function (done) {
				var k = [],
					k1 = [],
					jump;
				var arr = [0, 1, [2]]
				q1.addLikeArrayEach(arr, fun4, {}, 1).then(function (data) {
					if (data.join('') !== '012') return done("返回错误");
					done();
				}, err(done));
				q1.jump(fun2, [1]).then(function () {
					jump = 1;
				})
				q1.addLikeArrayEach(arr, fun4, 1, 1).then(function (data) {
					if (jump) return done("优先执行出错");
					if (data.join('') !== '012') return done("返回错误");
				}, err(done))
			})
			it('.addLikeArrayEach([arg1,arg2],fun,con,start,jump) 2 > err', function (done) {
				var k = [],
					k1 = [];
				var arr = [0, 1, [2, 2], 3, 4]
				q2.addLikeArrayEach(arr, fun4, 1).then(err(done), succ(2, done))
			})
			it('.addLikeProps(map,fun,con,start,jump) all > ok', function (done) {
				var k = [],
					k1 = [],
					jump;
				var map = {
					a: 1,
					b: 2,
					c: 3
				}
				q1.addLikeProps(map, fun3, 1).then(function (data) {
					if (data.a !== 1 || data.b !== 2 || data.c !== 3) return done("返回错误");
					done();
				}, err(done))
				q1.jump(fun2, [1]).then(function () {
					jump = 1;
				})
				q1.addLikeProps(map, fun3, 1, 1).then(function (data) {
					if (jump) return done("优先执行出错");
					if (data.a !== 1 || data.b !== 2 || data.c !== 3) return done("返回错误");
				}, err(done))
			})
			it('.addLikeProps(map,fun,con,start,jump) all > b > err', function (done) {
				var k = [],
					k1 = [];
				var map = {
					a: 1,
					b: [2, 2],
					c: 3
				}
				q2.addLikeProps(map, fun3, {}, 1).then(err(done), succ(2, done))
			})
			it('.addLikePropsEach([arg1,arg2],fun,con,start,jump) all ok', function (done) {
				var k = [],
					k1 = [],
					jump;
				var map = {
					a: 1,
					b: 2,
					c: 3
				}
				q1.addLikePropsEach(map, fun4, 1).then(function (data) {
					if (data.a !== 1 || data.b !== 2 || data.c !== 3) return done("返回错误");
					done();
				}, err(done))
				q1.jump(fun2, [1]).then(function () {
					jump = 1;
				})
				q1.addLikePropsEach(map, fun4, 1, 1).then(function (data) {
					if (jump) return done("优先执行出错");
					if (data.a !== 1 || data.b !== 2 || data.c !== 3) return done("返回错误");
				}, err(done))
			})
			it('.addLikePropsEach([arg1,arg2],fun,con,start,jump) 2 > err', function (done) {
				var k = [],
					k1 = [];
				var map = [0, 1, [2, 2], 3, 4]
				q2.addLikePropsEach(map, fun4, 1).then(err(done), succ(2, done))
			})
		})
	})
	describe('队列方法测试', function () {
		describe('#队列属性', function () {
			var q1 = new Queue(1);
			var fn = function (v) {
				return Q.delay(100, v)
			}
			it('.getMax()', function (done) {
				assert.equal(1, q1.getMax(), "初始错误")
				q1.setMax(5);
				assert.equal(5, q1.getMax(), "重新设置错误")
				q1.setMax(1);
				done();
			});
			it('.getLength()', function (done) {
				assert.equal(0, q1.getLength(), "初始错误")
				q1.push(fn, [1]).then(null, NULLFUN);
				assert.equal(1, q1.getLength(), "实时值错误")
				q1.addLikeArray([1, 2, 3], fn).then(null, NULLFUN);
				assert.equal(4, q1.getLength(), "实时值错误")
				q1.clear("clear");
				done();
			});
			it('.getRunCount()', function (done) {
				assert.equal(0, q1.getRunCount(), "初始错误")
				var p1 = q1.go(fn, [1]).then(null, NULLFUN);
				var p2 = q1.go(fn, [2]).then(null, NULLFUN);
				var p3 = q1.go(fn, [3]).then(null, NULLFUN);
				assert.equal(1, q1.getRunCount(), "实时值错误")
				q1.setMax(3);
				assert.equal(3, q1.getRunCount(), "实时值错误")
				Q.all([p1, p2, p3]).then(function () {
					done();
				})
			});
			it('.isStart()', function (done) {
				var q2 = new Queue(1);
				assert.equal(false, q2.isStart(), "初始错误")
				q2.go(fn, [1]).then(null, NULLFUN).then(function (v) {
					done(assert.equal(false, q2.isStart(), "实时值错误"));
				});
				assert.equal(true, q2.isStart(), "实时值错误")
			});
		})

		describe('#队列控制测试', function () {
			var q1 = new Queue(1)
			it('.start()', function (done) {
				var p = q1.push(fun2, [1]);
				q1.start();
				setTimeout(function () {
					p.then(succ(1, done))
				}, MAXTIME * 1.1)
			})
			it('.stop()', function (done) {
				var k = [];
				for (var i = 0; i < 5; i++) {
					q1.push(fun2, [i]).then(function (data) {
						k.push(data)
					})
				}
				q1.start();
				q1.stop();
				setTimeout(function () {
					//console.log(k)
					if (k.join('') !== "0") return done("暂停失败！")
					q1.start();
					q1.option("queueEnd", function () {
						if (k.join('') !== "01234") return done("恢复执行出现问题！")
						done();
					})
				}, MAXTIME * 2.1)
			})
			it('.clear()', function (done) {
				var k = [],
					ke = [];
				q1.option("queueEnd", null);
				for (var i = 0; i < 5; i++) {
					q1.push(fun2, [i]).then(function (data) {
						k.push(data)
					}, function (err) {
						ke.push(err)
					})
				}
				q1.start()
				q1.clear(2);
				setTimeout(function () {
					if (k.join('') !== "0" || ke.join('') !== "2222") return done("清除执行时出现问题！")
					done();
				}, MAXTIME * 2.1);
			})
			it('.setMax()', function (done) {
				var k = [],
					ke = [];
				var mn = 50
				for (var i = 0; i < mn; i++) {
					q1.push(fun2, [i]).then(function (data) {
						k.push(data)
					}, function (err) {
						ke.push(err)
					})
				};
				q1.start();
				q1.setMax(mn);
				setTimeout(function () {
					if (k.length < mn) return done("设置setMax出现问题！")
					done();
				}, MAXTIME * 1.5)
			})
			it('.setMax(-1) ', function (done) {
				q1.onError = function (err) {
					if (err.message == 'The "max" value is invalid') {
						done();
					}
				}
				q1.setMax(-1);
			})
		})
		describe('#队列事件测试', function () {
			// var q1 = new Queue(1,{
			// 	"workResolve":function(){console.log(this,arguments)}  //成功
			// 	,"workReject":function(){}  //失败
			// 	,"queueStart":function(){}  //队列开始
			// 	,"queueEnd":function(){}    //队列完成
			// 	,"event_add":function(){}    //有执行项添加进执行单元后执行
			// })
			it('#事件顺序测试', function (done) {
				var add1 = 0;
				var finally1 = 0;
				var arr = [];
				var push = function (i) {
					return function () {
						arr.push(i);
					}
				}
				var q1 = new Queue(1, {
					"workAdd": function () {
						add1++;
					},
					"queueStart": push("b"),
					"queueEnd": function (v, Qobj) {
						push("e")();
						//console.log(arr.join(""));
						if (arr.join("") != "b1yf2nfy3fn4fyfnfe") return done("顺序错误!")
						done();
					},
					"workResolve": push("y"),
					"workReject": push("n"),
					"workFinally": push("f")
				});

				q1.push(function () {
					return 1
				}, [1], {
					workResolve: function () {
						push(1)()
					}
				});
				q1.push(function () {
					throw 1
				}, {
					workReject: function () {
						push(2)()
					}
				}).then(null, NULLFUN);
				q1.push(function () {
					return 1
				}, {
					workFinally: function () {
						push(3)()
					}
				});
				q1.push(function () {
					throw 1
				}, {
					workFinally: function () {
						push(4)()
					}
				}).then(null, NULLFUN);

				q1.push(fun2, [9]);
				q1.push(fun2, [9, 9]).then(null, NULLFUN);

				q1.start();
			})
			describe('#onError 事件', function () {
				it('#默认打印错误', function (done) {
					var olderr = console.error;
					var errmark = 'errmark';
					console.error = function(err){
						console.error = olderr;
						if(err === errmark){
							done();
						}else{
							done('测试失败！')
						}
					}
					var q1 = new Queue(1, {
						workAdd: function(){
							throw errmark;
						}
					});
					q1.push(function () {});
				})

				it('#自定义onError 不为Function', function (done) {
					var throwfun = function (err) {
						return function () {
							throw err;
						}
					}
					var q1 = new Queue(1, {
						workAdd: throwfun("workAdd")
					});
					q1.onError = {};
					q1.push(function () {});
					done();
				})

				it('#队列事件出错捕获 , 自定义onError', function (done) {
					var errnb = {};
					var throwfun = function (err) {
						return function () {
							throw err;
						}
					}
					var q1 = new Queue(1, {
						queueStart: throwfun("queueStart"),
						queueEnd: throwfun("queueEnd"),
						workResolve: throwfun("workResolve"),
						workReject: throwfun("workReject")
					});
					q1.onError = function (err) {
						if (errnb[err]) {
							errnb[err] += 1
						} else {
							errnb[err] = 1;
						}
						if (err == "queueEnd") {
							if (errnb["queueStart"] == 1 &&
								errnb["queueEnd"] == 1 &&
								errnb["workReject"] == 2 &&
								errnb["workResolve"] == 2) {
								done()
							} else {
								done("onError 运行错误")
							}
						}
					}
					q1.push(function () {
						return 1
					});
					ADD(q1, "push")
					q1.push(function () {
						throw 1
					}).then(null, NULLFUN)
					q1.start();
				})
			})

			describe('#队列事件逻辑测试', function () {
				testDescriby("workResolve");
				testDescriby("workReject");
				testDescriby("workFinally");
			})


		})
		describe('#重试与超时', function () {
			it('#重试 默认', function (done) {
				var q1 = new Queue(2, {
					"retry": 0,
					"retryIsJump": 0 //重试模式  0:搁置执行(插入队列尾部重试),1:优先执行 (插入队列头部重试)
						,
					'_test': 0
				});
				if (q1.option("retry") == 0) q1.option("retry", 5);
				var rnumb = 0,
					rnumb1 = 0;
				q1.option("queueEnd", function () {
					if (rnumb == 0 || rnumb1 == 0) return done("未重试")
					if (rnumb !== 5 || rnumb1 !== 5) return done("重试次数错误！")
					done();
				})
				q1.go(function () {
					rnumb++;
					if (rnumb < 5) throw "err"
					return 1;
				})
				q1.go(function () {
					rnumb1++;
					if (rnumb1 < 5) throw "err"
					return 1;
				})
			})
			it('#重试 优先', function (done) {
				var q1 = new Queue(1, {
					"retry": 5,
					"retryIsJump": 1 //重试模式  0:搁置执行(插入队列尾部重试),1:优先执行 (插入队列头部重试)
				})
				var rnumb = 0,
					rnumb1 = 0;
				q1.go(function () {
					var def = Q.defer()
					setTimeout(function () {
						rnumb++;
						if (rnumb < 6) def.reject("err");
						else def.resolve(1);
					}, 20)
					return def.promise;
				})
				q1.go(function () {
					return rnumb
				}).then(succ(6, done), err(done))
			})
			it('#重试 优先队列设置', function (done) {
				var q1 = new Queue(1, {
					"retry": 5,
					"retryIsJump": 1 //重试模式
				})
				var qobj = {
					"retry": 3,
					"retryIsJump": 0 //重试模式
						,
					"_test": 1
				}
				var rnumb = 0,
					rnumb1 = 0;
				q1.go(function () {
					var def = Q.defer()
					setTimeout(function () {
						rnumb++;
						if (rnumb < 5) def.reject(rnumb);
						else def.resolve(1);
					}, 20)
					return def.promise;
				}, qobj).then(function () {
					done("重试出问题2");
				}, function (err) {
					if (err != 4) done("重试出问题1")
				})
				q1.go(function () {
					return rnumb
				}, qobj).then(succ(1, done), err(done))
			})
			it('#超时 ', function (done) {
				var q1 = new Queue(2, {
					"timeout": 100
				})
				q1.go(function () {
					var def = Q.defer();
					setTimeout(function () {
						def.resolve("OK")
					}, 200)
					return def.promise;
				}).then(err(done), succ("timeout", done))
				//}).then(function(d){console.log("d:",d)},function(e){console.log("e:",e)})
			})
			it('#超时 单独自定义', function (done) {
				var q1 = new Queue(2, {
					"timeout": 100
				})
				q1.go(function () {
					var def = Q.defer();
					setTimeout(function () {
						def.resolve("OK")
					}, 200)
					return def.promise;
				}, {
					timeout: 300
				}).then(succ("OK", done), err(done))
			})
		})
		describe("#使用其他Promise实现", function () {
			var promises = {
				"easy-promise": require('easy-promise'),
				"q": require('q')
			}
			if (typeof Promise == "function" && Promise.prototype.then) {
				promises["原生Promise"] = Promise;
			}
			for (var _p in promises) {
				(function (name, Promise) {
					var _then;
					if (Promise.prototype && Promise.prototype.then) {
						_then = Promise.prototype.then;
					} else if (Promise.defer) {
						_then = Promise.defer().promise.then;
					}

					it(name, function (done) {
						var _Queue = Queue.createUse(Promise);
						var queue = new _Queue(1);
						var mark;
						var promise = queue.go(fun2, [1]).then(function (d) {
							mark = d;
						}).then(function () {
							if (mark != 1) {
								return done("队列运行不正常")
							};
							//if(promise.return){reutrn done("未成功切换Promise实现")}
							if (_then === promise.then) done();
						})

					})
				})(_p, promises[_p])
			}

		})
	})
});