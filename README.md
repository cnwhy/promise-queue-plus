# queue-fun
`queue-fun` 重构并改名为 [promise-queue-plus](https://www.npmjs.com/package/promise-queue-plus), 'queue-fun' 不再更新. 

[![NPM version][npm-image]][npm-url]
[![npm download][download-image]][npm-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![Build Status][BuildStatus-image]][BuildStatus-url]

[npm-image]: https://img.shields.io/npm/v/queue-fun.svg
[download-image]: https://img.shields.io/npm/dm/queue-fun.svg
[npm-url]: https://npmjs.org/package/queue-fun
[coveralls-image]: https://coveralls.io/repos/cnwhy/queue-fun/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/r/cnwhy/queue-fun?branch=master
[BuildStatus-url]: https://travis-ci.org/cnwhy/queue-fun
[BuildStatus-image]: https://travis-ci.org/cnwhy/queue-fun.svg
queue-fun 是基于Promise的 运行队列控制类。

## 使用场景
- 巨量同逻辑业务平稳处理
- 间歇性高并发系统
- 控制单用户占用资源过高

**一点建议** 
>并不需要把整个业务的后续处理全都放到队列中去，而只是将高消耗的那一部分放入队列，利用Promise的异部处理机制来处理后续的操作。  
>如果已经在用Promise来控制异步流程,我相信这是一个非高好用的队列,因为你在在编写代码的时候几乎可以忘记队列的存在，但是他就在那里默默的工作着，代码可读性和灵活性也没有丝毫影响。

[github-q]: https://github.com/kriskowal/q
## 队列  
#### queuefun.Queue(*q*) 
初始化队类 参数**q**可传: 
- **无参数** 队列使用内置实现的Promise;  
- 传入 **[q][github-q] / 原生Promise** (插入队列方法: `push` `unshift` `go` `jump`返回对应的promise实例) , 其实现了`defer`,`then`类似promise的类都可以.  

```javascript
//使用内置实现的Promise
var Queue = queuefun.Queue() //promise实现和模仿了q的API,但比q要快 除了then, "done, spread, fail, fin"都是支持的 

//Queue1使用q做为队列使用的promise实现
var Queue1 = queuefun.Queue(require("q"));
//Queue2使用原生Promise做为队列使用的promise实现
var Queue2 = queuefun.Queue(Promise);
```

#### 实例化队列 new queuefun.Queue()(runMax, *con*) 
- runMax 并行运行队列方法的最大个数
- con 配置队列 **开始 结束** 事件,运行单元的 **成功,失败** 事件及配置执行单元出错的 **重试** 机制。[详细配置方法](https://github.com/cnwhy/queue-fun/wiki/%E5%AE%9E%E4%BE%8B%E5%8C%96%E9%98%9F%E5%88%97%E9%85%8D%E7%BD%AE%22%E8%B6%85%E6%97%B6%22,%22%E9%87%8D%E8%AF%95%22%E7%AD%89%E5%8F%82%E6%95%B0)  
```javascript
var queue = new Queue(100)
```

## Queue API  
#### queue.push(promisefun, *args[]*, *con*)  
向队列中尾部添加运行单元，返回promise  
- promisefun: promise function
- args: 传入的参数
- con [默认值](https://github.com/cnwhy/queue-fun/wiki/%E9%98%9F%E5%88%97%E5%85%83%E7%B4%A0-%E9%85%8D%E7%BD%AE%E5%8F%82%E6%95%B0%E8%AF%B4%E6%98%8E)  

#### queue.unshift(promisefun, *args[]*, *con*) 参数同push 向队列中头部添加运行单元  
#### queue.go(promisefun, *args[]*, *con*)  同push,添加后会启动队列.  
#### queue.jump(promisefun, *args[]*, *con*) 同unshift,添加后启动队列.  

### 批量添加
以下方法可以向队列添加一组运行单元，返回的promise对像，状态规则如下：
- 所有单元执行完前，且没有执行单元状态为rejected，其状态一直为pending
- 所有单元的promise状态都为fulfilled时，状态才为fulfilled，值为各执行单元值组成的数组或对像。
- 运行单元的promise有rejected时，其状态立即为rejected，理由同最先变为rejected的值行单元的理由。  

#### queue.all(arr,*start*,*jump*)
添加一批执行单元。
- `arr` 元素同queue.push方法 `[[promisefun,args,con], [promisefun,args,con]]`
- `start` 添加完后是否立即运行队列 默认 false
- `jump` 是否优先执行 默认 false  

#### queue.allLike/allArray (arrArgs[],promisefun,*con*,*start*,*jump*)  
向队列添加同一批同逻辑的运行单元.
- `arrArgs[]` array 参数数组,多个参数请嵌套数组 `[1,2,[3,3.1],4]`
- `promisefun`  

返回值为promise对像或类promise对像的方法，普通函数将转变以函数值为值的promise对像
- `con` 参看*queue.push* 可以省略
- `start` 添加完后是否立即运行队列 默认 false
- `jump` 是否优先执行 默认 false  

#### queue.allEach(arr/map,promisefun,*con*,*start*,*jump*)  
第一个参数可以是数组，也可以是一个map对像。  
类似allLike，只是向promisefun传参类似forEach传参 (element, index, arrArgs)  

#### queue.allMap(map,promisefun,*con*,*start*,*jump*)  
第一个参数可以是数组，也可以是一个map对像。  
类似allLike，只是向promisefun传参类似forEach传参 (element, index, arrArgs)  
注意：返回的promise，的值将也是一个map对像
  
### 队列控制
#### queue.setMax(newMax)  
修改并行数  

#### queue.start()  
启动队列  

#### queue.stop()  
暂停队列  

#### queue.clear(err)  
清空队列,队列中剩余的项都将以err为理由拒绝。  

## demo
``` javascript
var queuefun = require('queue-fun');
var Queue = queuefun.Queue(); //初始化Promise异步队列类
var q = queuefun.Q;  //配合使用的Promise流程控制类，也可以使用原生Promise也可以用q.js代替

//实列化一个最大并发为1的队列
var queue1 = new Queue(1); 

//定义一个Promise风格的异步方法
function testfun(i){
	var deferred = q.defer();
	setTimeout(function(){
		deferred.resolve(i)
	},300)
	return deferred.promise;
}
var log = function(a){ console.log(a); }

queue1.push(testfun,[1]) //向队列添加运行单元
.then(console.log); 

queue1.push(function(){return 2;}) //插入普通方法会按Promises/A+规则反回promise
.then(console.log);

queue1.unshift(testfun,[0]) //插入优先执行项 (后进先出)
.then(console.log);

queue1.allArray([3,4],testfun,{'event_succ':log}) //插入多个运行项 array,完成一项,将执行一次log方法
.then(console.log) 

queue1.allMap({'a':5,'b':6,'c':7},testfun,{'event_succ':log}) //插入多个运行项 map , 最后的promise值也是一个对应map
.then(console.log)

//queue1.start(); //执行队列
queue1.go(testfun,['go']).then(console.log) 
/*
 这条语等价于:
    queue1.push(testfun,['go']).then(console.log);
    queue1.start(); 
 一般情况下使用go方法将比较方便
*/

/* 输出如下:
0
1
2
3
4
[ 3, 4 ]
5
6
7
{ a: 5, b: 6, c: 7 }
go
*/
```

## 关于内置Promise实现类queuefun.Q
实现了Promises/A+规范及`done`,`spread`,`fail`,`fin`;  
API模仿[Q](https://github.com/kriskowal/q);  
模拟实现了 `q.defer`,`q.Promise`,`q.all`,`q.any`,`q.nfcall`,`q.nfapply`,`q.denodeify`,`q.delay` 等函数.
更详细的说明参看 [q模块][github-q]

