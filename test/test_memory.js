"use strict";
var express = require('express');
var Queue = require('../');
var Q = Queue.Q;
var app = express();
var sp = 1000;
var port = 8899;
var queues = [];
var queue1 = new Queue(100,{queueEnd:function(){console.log('end')}});


function pfun(){
	return function(v){
		return Q.delay(0,v);
	}
}

app.all('/', function(req, res, next){
	return res.end("现有"+queues.length+"个队列 queue1有"+queue1.getLength()+"个队列项");
});

app.all('/add/queue/:n', function(req, res, next){
	var addn = +req.params.n;
	var oRAM = process.memoryUsage().rss;
	if(addn > 0){
		for(var i = 0; i<addn; i++){
			queues.push(new Queue(1))
		}
		var ram = process.memoryUsage().rss-oRAM;
		res.end("增加"+addn+"个队列,内存增加"+(ram/1024)+"K "+"单个队列"+(ram/1024/addn)+"K");
	}else{
		next();
	}
});
app.all('/add/queue/clear',function(req, res, next){
	queues = [];
	global.gc();
	return res.end('队列清理完毕!')
})
app.all('/add/item/:n', function(req, res, next){
	var addn = +req.params.n;
	var oRAM = process.memoryUsage().rss;
	if(addn > 0){
		for(var i = 0; i<addn; i++){
			(function(v){
				queue1.go(pfun(),[v],{}).then(null,function(){});
			})(i)
		}
		var ram = process.memoryUsage().rss-oRAM;
		res.end("增加"+addn+"个队列项,内存增加"+(ram/1024)+"K "+"单个队列项至少"+(ram/1024/addn)+"K " + queue1.getLength());
	}else{
		next();
	}
});
app.all('/add/item/clear',function(req, res, next){
	queue1.clear("null");
	global.gc();
	return res.end("队列项清理完毕!");
})
app.listen(port,function(req, res, next){
	console.log("open http://127.0.0.1:" + port + "/");
});



//pfun()(1).then(console.log);

