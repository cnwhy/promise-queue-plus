"use strict";
var express = require('express');
var Queuefun = require('../index');
var Queue = Queuefun.Promise(1);
var queue = new Queue(1000)
var q = Queuefun.Q;
var app = express();
var sp = 500;

var cluster = require('cluster');
var http = require('http');
var numCPUs = require('os').cpus().length;

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

if (cluster.isMaster) {
    console.log('[master] ' + "start master...");

    for (var i = 0; i < numCPUs; i++) {
         cluster.fork();
    }

    cluster.on('listening', function (worker, address) {
        console.log('[master] ' + 'listening: worker' + worker.id + ',pid:' + worker.process.pid + ', Address:' + address.address + ":" + address.port);
    });

} else if (cluster.isWorker) {
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
	app.listen(11111);
}




