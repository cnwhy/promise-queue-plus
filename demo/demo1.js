var queuefun = require('../');
var Queue = queuefun.Queue(); //初始化Promise异步队列类
var q = queuefun.Q;  //配合使用的Promise流程控制类，也可以使用q.js代替

//实列化一个最大并发为1的队列
var queue1 = new Queue(1); 

//定义一个Promise风格的异步方法
function testfun(i){
	var deferred = q.defer();
	setTimeout(function(){
		deferred.resolve(i)
	},300)
	return deferred.promise;
}
var log = function(a){ console.log(a); }
//向队列添加运行单元
queue1.push(testfun,[1]).then(console.log); 
//插入普通方法会按Promises/A+规则反回promise
queue1.push(function(){return 2;}).then(console.log);
//插入优先执行项 (后进先出)
queue1.unshift(testfun,[0]).then(console.log);
//批量插入多个远行项 array
queue1.allArray([3,4],testfun,{'event_succ':log}).then(console.log) 
//批量插入多个远行项 map 
queue1.allMap({'a':5,'b':6,'c':7},testfun,{'event_succ':log}).then(console.log)
//执行队列
queue1.start();