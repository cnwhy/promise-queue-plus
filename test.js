var q = require("q");
var alignment = require('./index').Promise;

var alignment1 = new alignment(10,function(data){
	//console.log(">>>>>>>>>>>>", arguments)
	//console.log('第' + data + '个事件完成 - 正在运行的中的事件数：' + alignment1.ing + ' - 剩余运行队列：' + alignment1.lins.length)
},function(err,obj){
	console.log(arguments)
	obj.errNumber < 3 && this.jump(obj)  // 运行次数小于3 则重试
},null,function(){
	console.log("运行队列己空!",alignment1.ing)
})

function testfun(i){
	var deferred = q.defer();
	setTimeout(function(){
		if(i%50 == 1){
			deferred.reject(new Error("err " + i))
		}else{
			deferred.resolve(i)
		}
	},(Math.random() * 2000)>>0)
	return deferred.promise;
}
// console.log('----------------push')
// alignment1.push(testfun,[9])
// console.log('----------------go')
// alignment1.go(testfun,[9])
// return;

var leng = 60;
for(var i = 0; i<leng; i++){
	+function(){
		var k = i;
		alignment1.push(testfun,[k]).done(function(data){
			console.log("__________________OK___________________",k)
		},function(err){
			console.log("__________________Err___________________",k)
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
		console.log("__________________OK___________________")
	},function(){
		console.log("__________________Err___________________")
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