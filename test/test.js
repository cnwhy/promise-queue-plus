//var q = require("q");
var q = require("../index").Q;
var alignmenta = require('../index').Promise(1);
var alignment = require('../index').Promise(q);
//alignmenta.setQ(q);
var alignment1 = new alignment(10,function(data){
	//console.log(">>>>>>>>>>>>", arguments)
	console.log('第' + data + '个事件完成 - 正在运行的中的事件数：' + this.ing + ' - 剩余运行队列：' + this.lins.length)
},function(err,obj){
	console.log(obj.regs,"出错! ","重试了" + (obj.errNo-1) + "次");
},function(){
	console.log("运行队列开始运行!",this.ing)
},function(){
	console.log("运行队列己空!",this.ing)
},{
	retryNo:3 //出错重试次数
})

function testfun(i){
	var deferred = q.defer();
	setTimeout(function(){
		if(i%3 == 1){
			deferred.reject(new Error("err " + i))
		}else{
			deferred.resolve(i)
		}
	},(Math.random() * 5000)>>0)
	return deferred.promise;
}

var leng = 10;
for(var i = 0; i<leng; i++){
	+function(){
		var k = i;
		alignment1.push(testfun,[k]).done(function(data){
			//console.log("__________________OK___________________",k)
		},function(err){
			//console.log("__________________Err___________________",k)
		})
	}()
}
console.log("add " + leng + "add end");


setTimeout(function(){
	//alignment1.clear() //执行中途清空队列
	//再插入一个执行单元
	alignment1.go(function(){
		return testfun(999)
	})
	.done(function(data){
		console.log("__________________999OK___________________")
	},function(){
		console.log("__________________999Err___________________")
	})
},1000)

var a = 0;
return;
alignment1.event_end = function(){
	if(a) return;
	for(var i = 100; i<110; i++){
		+function(){
			var k = i;
			alignment1.push(testfun,[k])
		}()
	}
	a=1;
}

//setTimeout(function(){console.log('-----------')},10000000)