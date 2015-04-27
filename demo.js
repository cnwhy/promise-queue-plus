var q = require("q");
var Queue = require('./index').Promise(1);

//new Queue([并行数],<运行成功>,<远行出错>,<队列开始>,<队列结束>,<config>) 并行数必须,其他可省略 config 为最后一个参数
var queue1 = new Queue(5
,function(data,obj){
	console.log('第' + data + '事件完成 - 运行中事件数：' + this.ing + ' - 剩余：' + this.lins.length)
},function(err,obj){
	console.log(err)
},function(){
	console.log('--------队列开始了---------')
},function(){
	console.log('--------队列结束了---------')
},{
	retryON:0 //出错重试次数 默认0;
	,'event_add':function(){
		if(!this.isStart && this.lins.length == 10){ //当添加了10个事件后,自动运行队列
			console.log(">> 触发自动运行条件")
			this.start();
		}
	}
})

//一个Promise的异步方法
function testfun(i){
	var deferred = q.defer();
	setTimeout(function(){
		if(i%3 == 1 || i == "Q3"){
			deferred.reject(new Error("err " + i))
		}else{
			deferred.resolve(i)
		}
	},(Math.random() * 2000)>>0)
	return deferred.promise;
}


queue1.push(testfun,['Q1']) //添加不动启动
queue1.go(testfun,['Q2'],{ //添加并自动启动队列
	'event_succ':function(data){
		console.log(data,'完成!')
	}
	,'event_err':function(err){
		console.log(err)
	}
	,Queue_event:0 //标记此对象不走队列的成功失败事件.
})


queue1.go(testfun,['Q3'],{Queue_event:0})
//var Queue = require('./index').Promise(q); 前面传入了q所以可以这么用，传则不行。
.done(function(data){
	//脱离了队列的执行,也许在队列的结束事件之后执行.
	console.log(data,'done成功!')
},function(err){
	console.log(err)
})

setTimeout(function(){
	console.log('push 方式添加事件!')
	queue1.push(testfun,['Q4'])  //push方法添加会启动队列运行
	
},2000)
setTimeout(function(){
	console.log('go 方式添加事件!')
	queue1.go(testfun,['Q55'])  //go方法添加会启动队列运行
},2200)


setTimeout(function(){
	console.log('>> 开始连续添加事件')
	for(var i=0; i<20; i++){
		queue1.push(testfun,['ADD'+i]);
	}
},4000)