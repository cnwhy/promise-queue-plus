//持续运行测试
var alignment = require('../index');
var q = alignment.Q;

var leng =50000;
var minN = 5000

var alignment1 = new alignment(1000)

//console.log(alignment1)
function testfun(){
	return function(i){
		var deferred = q.defer();
		setTimeout(function(){
			if(i%2 == 1){
				deferred.reject(i)
			}else{
				deferred.resolve(i)
			}
			//deferred.resolve(i)
		},Math.random()*50>>0)
		//},Math.random()*30>>0)
		return deferred.promise;	
	}
}

var n = 0;
var adding = 0;
var data = 0;
function adde(){
	adding = 1;
	for(var i = 0; i<leng; i++){
		+function(){
			var k = n++;
			alignment1.go(testfun(),[k],{
				'event_item_finally':function(){
					data++;
					(data%20000 == 0) && console.log('第' + data + '个事件完成 - 运行中事件数：' + this.getRunCount() + ' - 剩余：' + this.getQueueLength());
					setTimeout((function(){
						if(this.getQueueLength()<minN){
							console.log('队列少于'+minN+'添加'+leng+'！')
							adding || adde();
						}
					}).bind(this),0)
				}
			}).then(null,function(){})
		}()
	}
	adding = 0;
}
adde()
