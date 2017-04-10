var Queue = require('../');
var q = Queue.Q; //内置的Promise，仿Q的API

//定义一些方法
function workResolve(data,obj){
	console.log('第' + data + '事件完成 - 运行中事件数：' + this.getRunCount() + ' - 剩余：' + this.getLength())
}
function workReject(err,obj){
	console.log('一个执行单元状态拒绝' + err)
}
function queueStart(){
	console.log('>>>>>> 队列开始')
}
function queueEnd(){
	console.log('<<<<<< 队列结束了')
}
function workFinally(){
	console.log('一个执行单元完成')
}
function workAdd(){
	console.log("向队列添加项 ",this.isStart(),this.getLength()) 
	if(!this.isStart() && this.getLength() >= 5){ //当添加了10个项后,运行队列
		console.log(">> 触发自动运行条件")
		this.start();
	}
}

// var q1 = new Queue(1)
// q1.push(function(){return "123"}).then(console.log,console.log);
// q1.start();

//new Queue([并行数],<options>) 并行数必须
var queue1 = new Queue(2,{
		"queueStart": queueStart
		,"queueEnd": queueEnd
		,"workResolve": workResolve
		,"workReject": workReject
		,"workFinally": workFinally
		,"retry":0 //出错重试次数 默认0;
		,'workAdd':workAdd //workAdd只会在push/unshift方法添向项时才触发！
	})

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
queue1.addLikeArrayEach([1,2,3,4,5],function(v,i,arr){
	var deferred = q.defer();
	setTimeout(function(){
		deferred.resolve(i+":"+v);
	},500);
	return deferred.promise;
},0,1).then(function(data){
	console.log(data);
})

setTimeout(function(){
	//用go添加项 将会启动队列；
	queue1.go(testfun,['Q2'])
	//添加的项返回的是一个promise,所以可以在添加时就定义好“回调”
	queue1.go(testfun,['Q3']).then(console.log,console.log)  //succ
	queue1.go(testfun,['Qerr']).then(console.log,console.log)  //err
	//也可以这样添加“回调”
	var con = {
		'workResolve':function(data){
			console.log(data + '完成!')
		}
		,'workReject':function(err){
			console.error(err)
		}
	}
	queue1.go(testfun,['Q4'],con)
	//标记此对象不会走队列的成功失败事件.
	queue1.go(testfun,['Q5'],{run_queue_event:false}).then(function(data){console.log(data + "不会触发队列初始化时定义的成功/失败方法")}) 
	
},0)