var queuefun = require('../index') 
var Queue = queuefun.Queue();
var q = queuefun.Q; //内置的Promise，仿Q的API

//定义一些方法
function event_succ(data,obj){
	console.log('第' + data + '事件完成 - 运行中事件数：' + this.ing + ' - 剩余：' + this.lins.length)
}
function event_err(err,obj){
	console.log('queue-err:',err)
}
function event_begin(){
	console.log('>>>>>> 队列开始')
}
function event_end(){
	console.log('<<<<<< 队列结束了')
}
function event_add(){
	console.log("向队列添加项",this.isStart,this.lins.length) 
	if(!this.isStart && this.lins.length >= 10){ //当添加了10个项后,运行队列
		console.log(">> 触发自动运行条件")
		this.start();
	}
}
var q1 = new Queue(1)
q1.push(function(){return "123"}).then(console.log,console.log);
q1.start();
return;
//new Queue([并行数],<运行成功>,<远行出错>,<队列开始>,<队列结束>,<config>) 并行数必须,其他可省略 config 为最后一个参数
var queue1 = new Queue(1,
	event_succ,
	event_err,
	event_begin,
	event_end,
	{
		"retryON":0 //出错重试次数 默认0;
		,'event_add':event_add //event_add只会在push/unshift方法添向项时才触发！
	})
//全config的方式 实例化和 queue1 功能抑制的队列
var queue2 = new Queue(1,{
    "event_succ": event_succ
    ,"event_err": event_err
    ,"event_begin": event_begin
    ,"event_end": event_end
    ,"event_add": event_add
    ,"retryON": 0
});

//一个Promise的异步方法
function testfun(i){
	var deferred = q.defer();
	setTimeout(function(){
		if(i%3 == 1 || i == "Qerr"){
			deferred.reject(new Error("err is " + i))
		}else{
			deferred.resolve(i)
		}
	},1000)
	return deferred.promise;
}

//用push添加项 不会启动队列；
queue1.push(testfun,['Q1'])
queue1.addArray([1,2,3,4,5],function(v,i,arr){
	var deferred = q.defer();
	setTimeout(function(){
		console.log(v)
		deferred.resolve(i+":"+v);
	},500);
	return deferred.promise;
},0,1).then(function(data){
	console.log(data);
})

return;
setTimeout(function(){
	//用go添加项 将会启动队列；
	queue1.go(testfun,['Q2'])
	//添加的项返回的是一个promise,所以可以在添加时就定义好“回调”
	queue1.go(testfun,['Q3']).then(console.log,console.error)  //succ
	queue1.go(testfun,['Qerr']).then(console.log,console.error)  //err
	//也可以这样添加“回调”
	var con = {
		'event_succ':function(data){
			console.log(data + '完成!')
		}
		,'event_err':function(err){
			console.error(err)
		}
	}
	queue1.go(testfun,['Q4'],con)
	//标记此对象不会走队列的成功失败事件.
	queue1.go(testfun,['Q5'],{Queue_event:0}).then(function(data){console.log(data + "不会触发队列初始化时定义的成功/失败方法")}) 
	//promise的链式操作没有问题
	queue1.go(testfun,['Q6'],{Queue_event:0})
	.then(function(data){
		console.log(data);
		var deferred = q.defer();
		setTimeout(function(){
			deferred.resolve(data + "+");
		},500)
		return deferred.promise;
	}).then(function(data){
		console.log(data);
		return data + "+"
	}).then(function(data){
		console.log(data)
		setTimeout(function(){add2()},1000);
		throw "Q6 then err";
	}).done(null,console.error)
},1000)

function add2(){
	for(var i = 0 ;i<10; i++){
		queue2.push(testfun,[i],{Queue_event:1})
	}
}