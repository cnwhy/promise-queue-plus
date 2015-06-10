#queue-fun
queue-fun 是基于Promise的 运行队列控制类。

## 使用场景
- 巨量同逻辑业务平稳处理
- 间歇性高并发系统
- 控制单用户占用资源过高

###队列
#####queue-fun.Queue(*q*) 
初始化队类 参数**q**可传 
- **无参数** 队列使用内置的实现的Promise;  
- **[q](https://github.com/kriskowal/q)/ES6原生Promise** 插入队列方法: `push` `unshift` `go` `jump`返回对应的promise 

#####实例化队列 new queue-fun.Queue()(runMax, *con*) 
- runMax 并行运行队列方法的最大个数
- con 配置队列 **开始 结束** 事件,运行单元的 **成功,失败** 事件及配置执行单元出错的 **重试** 机制。  
```javascript
var queue = new queue-fun.Queue()(100,{
		"event_succ":function(){}    //成功
		,"event_err":function(){}    //失败
		,"event_begin":function(){}  //队列开始
		,"event_end":function(){}    //队列完成
		,"event_add":function(){}    //有执行项添加进执行单元后执行,注意go及jump不会触发  
		,"retryON":0                 //队列单元出错重试次数  
		,"retryType":0               //重试模式true/false(优先/搁置)执行
	})`
```

####API
##### queue.push(promisefun, *args[]*, *con*)
向队列中尾部添加运行单元，返回promise
- promisefun: promise function
- args: 传入的参数
- con 默认值
```javascript
{
	'event_succ':null
	,'event_err':null
	,'Queue_event':true //默认会执行队列定义的回调
}
```
#####queue.unshift(promisefun, *args[]*, *con*) 同push 向队列中头部添加运行单元
#####queue.go(promisefun, *args[]*, *con*)  同push,添加后会启动队列.
#####queue.jump(promisefun, *args[]*, *con*) 同unshift,添加后启动队列.
#### 批量添加
以下方法可以向队列添加一组运行单元，返回的promise对像，promise对像状态规则：
- 所有单元执行完前，且没有执行单元状态为rejected，其状态一直为pending
- 所有单元的promise状态都为fulfilled时，状态才为fulfilled，值为各执行单元值组成的数组或对像。
- 运行单元的promise有rejected时，其状态立即为rejected，理由同最先变为rejected的值行单元的理由。
#####queue.all(arr,*start*,*jump*)
添加一批执行单元。
- `arr` 元素同queue.push方法 `[[promisefun,args,con], [promisefun,args,con]]`
- `start` 添加完后是否立即运行队列 默认 false
- `jump` 是否优先执行 默认 false
#####queue.allLike/allArray (arrArgs[],promisefun,*con*,*start*,*jump*)
向队列添加同一批同逻辑的运行单元.
- `arrArgs[]` array 参数数组,多个参数请嵌套数组 `[1,2,[3,3.1],4]`
- `promisefun` 返回值为promise对像或类promise对像的方法，普通函数将转变以函数值为值的promise对像
- `con` 参看*queue.push* 可以省略
- `start` 添加完后是否立即运行队列 默认 false
- `jump` 是否优先执行 默认 false
#####queue.allEach(arr/map,promisefun,*con*,*start*,*jump*)
第一个参数可以是数组，也可以是一个map对像。
类似allLike，只是向promisefun传参类似forEach传参 (element, index, arrArgs)
#####setMax(newMax)  
修改并行数
#####queue.start()  
启动队列
#####queue.stop()  
暂停队列 
#####queue.clear(err)  
清空队列
队列中剩余的项都将以err为理由拒绝。

### demo
``` javascript
var queuefun = require('queue-fun');  //引入
//初始化Promise异步队列类
var Queue = queuefun.Queue(); 
//实列化最大并发为2的运行队列
var queue1 = new Queue(2,{
	"event_succ":function(data){console.log('queue-succ:',data)}  //成功
	,"event_err":function(err){console.log('queue-succ:',data)}  //失败
}); 
var q = queuefun.Q;  //模块中简单实现了Q的基本功能，可以一试，
//定义一个Promise风格的异步方法
function testfun(i){
	var deferred = q.defer();
	setTimeout(function(){
		if(i\ && i % 3 == 0){
			deferred.reject(new Error("err " + i))
		}else{
			deferred.resolve(i)
		}
	},(Math.random() * 2000)>>0)
	return deferred.promise;
}
//向队列添加运行单元
queue1.push(testfun,[1]) //添加运行项
queue1.go(testfun,[2]) //添加并自动启动队列
queue1.go(testfun,[3],{Queue_event:0}) //添加不会触发队列 回调的运行项.
queue1.go(testfun,[4]).then(
	function(data){console.log('done-succ:',data)},
	function(err){console.log('done-err:',err)}
)
queue1.go(testfun,[5],{
	event_succ:function(data){console.log('conf-succ:',data)},
	event_err:function(err){console.log('conf-err:',err)}
})
```

## 关于内置Promise实现类queuefun.Q
实现了Promises/A+规范及`done`,`spread`,`fail`;  
API模仿[Q](https://github.com/kriskowal/q);  
模拟实现了 `q.defer`,`q.Promise`,`q.all`,`q.any`,`q.nfcall`,`q.nfapply`,`q.denodeify` 等函数.
##### .toPromis(obj).then()
如果你习惯了.then风格写代码,你可以尝试用toPromis将普通函数/语句包装一下，让他可以获得then方法,及捕获错误。
```javascript
var add = function(a,b){return a+b;}
q.toPromis(function(){return add(a+b)})
	.then(console.log,console.error)
```

## 待完善
- 集群支持
- 内存溢出隐患处理
- 其它Promise实现类的支持