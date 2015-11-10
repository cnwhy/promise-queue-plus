var queuefun = require('../');  //引入
var q = require("q");
//var promise = require("promise");
//var thenjs = require("thenjs");

//初始化Promise异步队列类,参数1表示带Promise类型的反回
var Queue = queuefun.Queue();
var queue1 = new Queue(2,{
    "event_succ":function(data){console.log('queue-succ:',data)}  //成功
    ,"event_err":function(err){console.log('queue-err:',data)}  //失败
    ,"event_begin":function(){console.log(">>>>> 测试异步元素开始")}
    ,"event_end":function(){console.log("<<<<< 结束")}
}); //实列化最大并发为2的运行队列
//var q = queuefun.Q;  //模块中简单实现了Q的基本功能，可以一试，
//定义一个Promise风格的异步方法
console.log(Promise)
//q
queue1.push(function(){
	var def = q.defer();
    setTimeout(function(){
        def.resolve("q模块")
    },(Math.random() * 2000)>>0)
    return def.promise;
})
//es6 Promise
queue1.push(function(){
    return new Promise(function (resolve, reject) {
        setTimeout(function(){
            resolve("promise模块")
        },(Math.random() * 2000)>>0)
    });
})
//promise 模块
// queue1.push(function(){
//     var def = promise();
//     console.log(def)
//     setTimeout(function(){
//         def.resolve("node自带模块")
//     },(Math.random() * 2000)>>0)
//     return def.promise;
// })
// queue1.push(function(){
//  var def = new promise.Defer();
//     setTimeout(function(){
//         def.resolve("promise模块")
//     },(Math.random() * 2000)>>0)
//     return def.promise;
// })
queue1.start();