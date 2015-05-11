var queuefun = require('../');  //引入
var q = require("q");
var Promise = require("Promise");
var thenjs = require("thenjs");

//初始化Promise异步队列类,参数1表示带Promise类型的反回
var Queue = queuefun.Promise(1);
var queue1 = new Queue(2,{
    "event_succ":function(data){console.log('queue-succ:',data)}  //成功
    ,"event_err":function(err){console.log('queue-err:',data)}  //失败
}); //实列化最大并发为2的运行队列
//var q = queuefun.Q;  //模块中简单实现了Q的基本功能，可以一试，
//定义一个Promise风格的异步方法

//q
queue1.push(function(){
	var def = q.defer();
    setTimeout(function(){
        if(err){
            def.reject(err)
        }else{
            def.resolve("a模块")
        }
    },(Math.random() * 2000)>>0)
    return def.promise;
})

queue1.push(function(){
	
})


function qfun(i,err){
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


//向队列添加运行单元
var pro1 = queue1.push(testfun,[1]); //添加运行项
pro1.then(function(data){
	console.log('then1-succ:',data)
})
pro1.then(function(data){
	console.log('then2-succ:',data)
})
queue1.go(testfun,[2]) //添加并自动启动队列
queue1.go(testfun,[3],{Queue_event:0}) //添加不会触发队列回调的运行项.
queue1.go(testfun,[4,4]).done(function(data){
	console.log('done-succ:',data)
},function(err){
	console.log('done-err:',err)
})
queue1.go(testfun,[5],{
	event_succ:function(data){
		console.log('conf-succ:',data)
	},
    event_err:function(err){
		console.log('conf-err:',err)
	}
})