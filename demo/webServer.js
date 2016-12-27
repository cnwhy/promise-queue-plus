"use strict";
var express = require('express');
var QueueFun = require('../');
var q = QueueFun.Q;
var app = express();
var sp = 500;

var queue = new QueueFun(1,{
	'event_queue_add' : setBusy
	,'event_item_finally': setBusy
})

var isBusy = false
function setBusy(){
	var queueLength = this.getQueueLength();
	if(queueLength > 5){
		isBusy = true;
	}
	if(queueLength < 2){
		isBusy = false;
	}
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

app.use(function(req, res, next){
	if(isBusy){
		res.end("sever busy!")
	}else{
		next();
	};
})

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
//有延时，有队列
app.all('/test3', function(req, res, next){
	queue.go(promfun1,[sp,'test3 OK']).done(function(data){
		res.end(data)
	},function(err){
		next(new Error(err));
	})
});
app.listen(8800);





