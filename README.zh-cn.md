# Promise Queue +  
[![NPM version][npm-image]][npm-url]
[![npm download][download-image]][npm-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![Build Status][BuildStatus-image]][BuildStatus-url]

promise-queue-plus 是一个基于Promise的持续队列,支持设置超时与重试。

## 使用场景
- 巨量同逻辑业务平稳处理
- 间歇性高并发系统
- 控制单用户占用资源过高

**一点建议** 
>并不需要把整个业务的后续处理全都放到队列中去，而只是将高消耗的那一部分放入队列，利用Promise的异部处理机制来处理后续的操作。  
>如果已经在用Promise来控制异步流程,我相信这是一个非高好用的队列,因为你在在编写代码的时候几乎可以忘记队列的存在，但是他就在那里默默的工作着，代码可读性和灵活性也没有丝毫影响。

## demo
``` javascript
var Queue = require('promise-queue-plus');
var q = Queue.Q;  //配合使用的Promise流程控制类，也可以使用原生Promise也可以用q.js,等实现Prmise的类库

//实列化一个最大并发为1的队列
var queue1 = new Queue(1,{
        ,"retry":0              //执行单元出错重试次数
        ,"retry_type":false     //重试模式 false:搁置,true:优先 
        ,"timeout":0            //超时
    });

//定义一个Promise风格的异步方法
function testfn(i){
    var defer = q.defer();
    setTimeout(function(){
        defer.resolve(i)
    },300)
    return defer.promise;
}
var log = function(a){ console.log(a); }

queue1.push(testfn,[1]) //向队列添加运行单元
.then(console.log); 

queue1.push(function(){return 2;}) //插入普通方法会按Promises/A+规则反回promise
.then(console.log);

queue1.unshift(testfn,[0]) //插入优先执行项 (后进先出)
.then(console.log);

queue1.addLikeArray([3,4],testfn,{'event_item_resolve':log}) //插入多个运行项 array,完成一项,将执行一次log
.then(console.log) 

queue1.addLikeProps({'a':5,'b':6,'c':7},testfn,{'event_item_resolve':log}) //插入多个运行项 map , 最后的promise值也是一个对应map
.then(console.log)

//queue1.start(); //执行队列
queue1.go(testfn,['go']).then(console.log) 
/*
 这条语等价于:
    queue1.push(testfn,['go']).then(console.log);
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

## API 
V0.x [请看这里](https://github.com/cnwhy/queue-fun/blob/0.x/README.md)  
### new Queue(runMax,*options*) 实例化队列
- runMax 并行运行队列方法的最大个数
- options 配置队列 **开始,结束** 事件,运行单元的 **成功,失败** 事件及 **重试,超时** 配置。
```js
var Queue = require("promise-queue-plus");
var queue = new Queue(10,{
        "event_queue_begin":function(queue){}         //队列开始
        ,"event_queue_end":function(queue){}          //队列完成
        ,"event_queue_add":function(item,queue){}     //有执行项添加到队列后执行
        ,"event_item_resolve":function(value,queue){} //执行单元resolve后执行
        ,"event_item_reject":function(reason,queue){}    //执行单元reject后执行
        ,"event_item_finally":function(queue){}       //执行单元完成后执行
        ,"retry":0                                    //执行单元出错重试次数
        ,"retry_type":false                           //重试模式 false:搁置,true:优先 
        ,"timeout":0                                  //执行单元的超时时间(毫秒)
    })
```

### Queue.Q
配合使用的Promise流程控制类,是一个扩展的Promise类, 参看 [extend-promise#类扩展](https://github.com/cnwhy/extend-promise#类扩展)  
注:并未用[extend-promise][github-extend-promise]库展Promise原型,promise实例的方法与内部使用的Promise有关

### Queue.use(Promise) , Queue.createUse(Promise)
修改内部使用的Promise , v1.X 默认使用的是 [bluebird][github-bluebird]  
如有必要可以切换为其他Promise实现类如 **[q][github-q] / 原生Promise** 其实现了`defer`,`then`的promise的类都可以.
设置此项将影响插入队列方法: `push` `unshift` `go` `jump` 等返回的promise实例.  
Queue.use(Promise) 是修改当前类的内部Promise;  
Queue.createUse(Promise) 将返回一个新的类;  
>做过很多Promise实现库的对比,`bluebird`确实是最快的.

```javascript
var Queue = require("promise-queue-plus") //默认内部使用bluebird
Queue.Promise.defer().promise instanceof Promise; //false
//换为ES6原生Promise
Queue.use(Promise);  
Queue.Promise.defer().promise instanceof Promise; //true
var queue1 = new Queue(1);
queue1.push(function(){}) instanceof Promise; //true;

//创建一个新的类NQueue,此类内部使用q做为队列使用的promise实现,不影响原来的Queue;
var NQueue = Queue.createUse(require("q")); //使用q模块
```

### queue.push(promisefun, *args[]*, *options*)  
向队列中尾部添加运行单元，返回promise  
- promisefun: promise function
- args: 传入的参数
- options  配置独立的 **成功,失败** 事件及 **重试,超时** 配置,在批量插入队列时会比较有用。
```js
queue.push(function(a,b){return a+b;},[1,2],{
    ,"event_item_resolve":false                   //1. 值为false,不会触发队列配置的事件,默认为true;
    ,"event_item_reject":function(reason,queue){} //2. 值为函数,将先执行此函数,再触发队列配置的事件
    ,"event_item_finally":function(queue){return false;} //3. 若显式反回false,不会再触发队列配置的事件
    ,"retry":0                                 //错重试次数,覆盖队列配置
    ,"retry_type":false                        //重试模式 false:搁置,true:优先 ,覆盖队列配置
    ,"timeout":0                               //结执行单元的超时时间(毫秒)
});
```


### queue.unshift(promisefun, *args[]*, *options*) 
参数同 `push` 向队列中头部添加运行单元  
### queue.go(promisefun, *args[]*, *options*)  
同 `push`,会启动队列.  
### queue.jump(promisefun, *args[]*, *options*) 
同 `unshift`,会启动队列.  

### 批量添加
以下方法可以向队列添加一组运行单元，返回的promise对像，状态规则如下：
- 所有单元执行完前，且没有执行单元状态为rejected，其状态一直为pending
- 所有单元的promise状态都为fulfilled时，状态才为fulfilled，值为各执行单元值组成的数组或对像。
- 运行单元的promise有rejected时，其状态立即为rejected，理由同最先变为rejected的值行单元的理由。  

### queue.addArray(arr,*start*,*jump*)
添加一批执行单元,返回的promise解决值为一个数组。
- `arr` 元素同queue.push方法的参数 `[promisefun,args[],options]`
- `start` 添加完后是否立即运行队列 可以省略 默认 false
- `jump` 是否优先执行 可以省略 默认 false  

```js
queue.addArray([
    [function(a){return a},[1],{}],
    [function(a,b){return a+b;},[1,2],{}]
],true).then(console.log,console.error);
//output [1,3]
```

### queue.addProps(props,*start*,*jump*)
添加一批执行单元,返回的promise解决值为和props对应的对像。
- `props` 是一个map对像,值同queue.push方法的参数 `[promisefun,args[],options]`
- `start` 添加完后是否立即运行队列 可以省略 默认 false
- `jump` 是否优先执行 可以省略 默认 false  

```js
queue.addProps({
    a:[function(a){return a},[1]],
    b:[function(a,b){return a+b;},[1,2]]
},true).then(console.log,console.error);
//output {a:1,b:3}
```

### queue.addLikeArray (arrArgs[],promisefun,*options*,*start*,*jump*)  
向队列添加同一批同逻辑的运行单元,返回的promise解决值为一个数组.
- `arrArgs[]` array 参数数组,多个参数请嵌套数组`[1,2,[3,3.1],4]`,向promisefun传参时会自动展开.
- `promisefun` 返回值为promise对像或类promise对像的方法，普通函数将转变以函数值为值的promise对像
- `options` 参看*queue.push* 可以省略
- `start` 添加完后是否立即运行队列 可以省略 默认false
- `jump` 是否优先执行 可以省略 默认false  

```js
function addfn(){
    var i = 0,sum;
    while(i<arguments.length){
        sum = i == 0 ? arguments[i] : sum + arguments[i];
    }
    return sum;
}
queue.addLikeArray([1,[1,2]],addfn,true).then(console.log,console.error);
//output [1,3]
```

### queue.addLikeArrayEach (arrArgs[],promisefun,*options*,*start*,*jump*)
类似`queue.addLikeArray`,只是向`promisefun`传参有区别,类似forEach传参 (element, index, arrArgs)

```js
function fn(v,i,arr){
    return i + " : " + v;
}
queue.addLikeArrayEach([1,[1,2]],fn,true).then(console.log,console.error);
//output [ '0 : 1', '1 : 1,2' ]
```

### queue.addLikeProps (props,promisefun,*options*,*start*,*jump*)  
向队列添加同一批同逻辑的运行单元,返回的promise解决值为和props对应的对像.
- `props`  是一个map对像,值为数组时,会展开向`promisefun`传参.
- `promisefun` 返回值为promise对像或类promise对像的方法，普通函数将转变以函数值为值的promise对像
- `options` 参看*queue.push* 可以省略
- `start` 添加完后是否立即运行队列 可以省略 默认false
- `jump` 是否优先执行 可以省略 默认false  

### queue.addLikePropsEach (props,promisefun,*options*,*start*,*jump*)
类似`queue.addLikeArray`,只是向`promisefun`传参有区别,类似forEach传参 (value, key, props)

### queue.start()
启动队列  

### queue.stop()
暂停队列

### queue.clear(reason)  
清空队列,队列中未开始执行的剩余的项都将以`reason`为理由拒绝。

### queue.option(name, *value*)  
获取/设置 队列配置 `options`

### queue.getMax()
获取队列最大并行数

### queue.setMax(newMax)
修改队列并行数  
- `newMax` 新的并行数,若队列已启动,不会影响

### queue.getLength() 
获取队列中剩余项数

### queue.getRunCount()
获取正在运行的项数

### queue.isStart()
队列是否正在运行

### queue.onError = function(err){}
队列其它事件抛出的错误都将在此函数捕获,默认为一个空函数,你可以直接制定处理函数.

## 关于浏览器端 
考虑到 [bluebird][github-bluebird] 的大小, 浏览器端使用了简洁的 [easy-promise][github-easy-promise]做为内部使用的Promise;  
- dist/promise-queue-plus.js
- dist/promise-queue-plus.min.js (gzip 3.8k)

[npm-image]: https://img.shields.io/npm/v/promise-queue-plus.svg
[download-image]: https://img.shields.io/npm/dm/promise-queue-plus.svg
[npm-url]: https://npmjs.org/package/promise-queue-plus
[coveralls-image]: https://coveralls.io/repos/cnwhy/promise-queue-plus/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/r/cnwhy/promise-queue-plus?branch=master
[BuildStatus-url]: https://travis-ci.org/cnwhy/promise-queue-plus
[BuildStatus-image]: https://api.travis-ci.org/cnwhy/promise-queue-plus.svg

[github-q]: https://github.com/kriskowal/q
[github-bluebird]: https://github.com/petkaantonov/bluebird
[github-easy-promise]: https://github.com/petkaantonov/bluebird
[github-extend-promise]: https://github.com/cnwhy/extend-promise