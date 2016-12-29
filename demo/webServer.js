"use strict";
var express = require('express');
var QueueFun = require('../');
var q = QueueFun.Q;
var app = express();
var sp = 1000;
var port = 8800;

var queue = new QueueFun(1,{
	'event_queue_add' : setBusy
	,'event_item_finally': setBusy
})

var isBusy = false
function setBusy(){
	var queueLength = this.getLength();
	isBusy = queueLength > 3
}

function cb(sp,cb){
	setTimeout(cb,sp)
}
function promfun1(sp,i){
	var deferred = q.defer();
	setTimeout(function(){
		deferred.resolve(i)
	},sp)
	return deferred.promise;
}

app.all('/', function(req, res, next){
	res.end("hello world!")
});

//无延时
app.all('/test1', function(req, res, next){
	res.end("test1 OK")
});
//有延时，无队列
app.all('/test2', function(req, res, next){
	cb(sp,function(){
		res.end("test2 OK")
	})
});


app.use('/test3',function(req, res, next){
	if(isBusy){
		return res.end("sever busy!")
	}else{
		next();
	};
})

//有延时，有队列
app.all('/test3', function(req, res, next){
	queue.go(promfun1,[sp,'test3 OK']).done(function(data){
		res.end(data)
	},function(err){
		next(new Error(err));
	})
});
app.listen(port,function(){
	console.log("打开 http://127.0.0.1:" + port + "/test3 快速刷新查看效果");
});





