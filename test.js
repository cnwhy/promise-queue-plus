var q = require("q");
var alignment = require('./index').Promise;

var alignment1 = alignment(10,function(data){
	console.log('第' + data + '个事件完成 - 正在运行的中的事件数：' + alignment1.ing + ' - 剩余运行队列：' + alignment1.lins.length)
},function(err,obj){
	console.log(arguments)
	obj.errNumber < 3 && this.go(obj)  // 运行次数小于3 则重试
},null,function(){
	console.log("运行队列己空!",alignment1.ing)
})

function yanshi(i){
	var deferred = q.defer();
	setTimeout(function(){
		if(i%100 == 1){
			deferred.reject(new Error("err " + i))
		}else{
			deferred.resolve(i)
		}
	},(Math.random() * 3000)>>0)
	return deferred.promise;
}

var leng = 100;
for(var i = 0; i<leng; i++){
	+function(){
		var k = i;
		alignment1.go(function(){
			return yanshi(k);
		})
	}()
}
console.log("add " + leng + "add end");

setTimeout(function(){
	alignment1.clear() //执行中途清空队列
	//再插入一个执行单元
	alignment1.go(function(){
		return yanshi(999)
	})
},5000)


//setTimeout(function(){console.log('-----------')},10000000)