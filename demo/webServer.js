"use strict";
var express = require('express');
var Queue = require('../');
var q = Queue.Q;
var app = express();
var port = 8800;

var queue = new Queue(1,{
	'workAdd' : setBusy
	,'workFinally': setBusy
})

var isBusy = false
function setBusy(){
	var queueLength = this.getLength();
	isBusy = queueLength > 3;
}

function promfun1(i){
	var deferred = q.defer();
	setTimeout(function(){
		deferred.resolve(i)
	},sp)
	return deferred.promise;
}

app.use('/',function(req, res, next){
	if(isBusy){
		return next("server busy!")
	}else{
		next();
	};
})

app.all('/', function(req, res, next){
	queue.go(promfun1,['Hello Word!']).done(function(data){
		res.end(data)
	},function(err){
		next(new Error(err));
	})
});

app.use(function (err, req, res, next) {
  console.error('[' + new Date() + ']\n' + err.stack)
  var msg = err.stack || err.toString();
  res.status(500).send(msg || "<h1>出错了!</h1> 请刷新页面或联系管理员!")
})

app.listen(port, function() {
	console.log(new Date() + ':start server on port ' + port)
})