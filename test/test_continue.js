//持续运行测试
var q = require("q");
var alignment = require('../index').Promise();

var leng =50000;
var minN = 500

var alignment1 = new alignment(1000,function(data){
	//console.log(">>>>>>>>>>>>", arguments)
	//console.log('第' + data + '个事件完成 - 正在运行的中的事件数：' + alignment1.ing + ' - 剩余运行队列：' + alignment1.lins.length)
	(data%5000 == 0) && console.log('第' + data + '个事件完成 - 正在运行的中的事件数：' + alignment1.ing + ' - 剩余运行队列：' + alignment1.lins.length)
	if(alignment1.lins.length<minN){
		console.log('队列少于'+minN+'添加'+50000+'！')
		adding || adde();
	}
},function(err,obj){
	console.log(err)
	//obj.errNumber < 3 && this.jump(obj)  // 运行次数小于3 则重试
},null,function(){
	console.log("运行队列己空!",alignment1.ing)
})

//console.log(alignment1)
function testfun(i){
	var deferred = q.defer();
	setTimeout(function(){
		if(i%8000 == 1){
			deferred.reject(new Error("err " + i))
		}else{
			deferred.resolve(i)
		}
		//deferred.resolve(i)
	},(Math.random() * 1000)>>0)
	return deferred.promise;
}

var n = 0;
var adding = 0;
function adde(){
	adding = 1;
	for(var i = 0; i<leng; i++){
		+function(){
			var k = n++;
			alignment1.go(testfun,[k],{
				'event_succ':function(data){
					//console.log(">>>>>>>>>>>>", arguments)
					//console.log('第' + data + '个事件完成 - 正在运行的中的事件数：' + alignment1.ing + ' - 剩余运行队列：' + alignment1.lins.length)
					(data%5000 == 0) && console.log('第' + data + '个事件完成 - 运行中事件数：' + this.ing + ' - 剩余：' + this.lins.length)
					if(this.lins.length<minN){
						console.log('队列少于'+minN+'添加'+50000+'！')
						adding || adde();
					}
				}
				,'event_err':function(err){
					console.log(err)
				}
				,Queue_event:0
			})
			// .done(function(data){
			// 	//(data%1000 == 0) && console.log('第' + data + '个事件完成 - 正在运行的中的事件数：' + alignment1.ing + ' - 剩余运行队列：' + alignment1.lins.length)
			// },function(err){
			// 	//console.log(err)
			// })
		}()
	}
	adding = 0;
}
adde()
