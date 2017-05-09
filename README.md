# Promise Queue +  
[![NPM version][npm-image]][npm-url]
[![npm download][download-image]][npm-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![Build Status][BuildStatus-image]][BuildStatus-url]

Promise-based queue. Support timeout, retry and so on.  

## demo
``` javascript
var Queue = require('promise-queue-plus');
var q = Queue.Promise; //a Promise utils;

//Realize a queue with a maximum concurrency of 1
var queue1 = new Queue(1,{
        "retry":0               //Number of retries
        ,"retryIsJump":false     //retry now? 
        ,"timeout":0            //The timeout period
    });

//a return promise function
function testfn(i){
    return new Promise(function(resolve,reject){
        setTimeout(function(){
            resolve(i)
        },300)
    })
}
var log = function(msg){ console.log(msg); }

queue1.push(testfn,[1]) //add job (FIFO)
.then(log); 

queue1.push(function(){return 2;}) //The normal function returns a promise according to the Promise / A + rule
.then(log);

queue1.unshift(testfn,[0]) //add job (LIFO)
.then(log);

queue1.addLikeArray([3,4],testfn,{'workResolve':log}) //Add multiple jobs with Array, Work done will execute 'workResolve'
.then(log) 

queue1.addLikeProps({'a':5,'b':6,'c':7},testfn,{'workResolve':log}) //Add multiple jobs with Map,
.then(log)

//queue1.start(); //queue start;
queue1.go(testfn,['go']).then(log) 
/*
 Equivalent to:
    queue1.push(testfn,['go']).then(console.log);
    queue1.start(); 
* In general, it is convenient to use the 'go'
*/

// Output:
/* 
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

### new Queue(maxConcurrent,*options*)
Creates a queue;
- `maxConcurrent` MaxNumber Concurrent

about options like:
```js
var Queue = require("promise-queue-plus");
var queue = new Queue(10,{
        "queueStart":function(queue){}         
        ,"queueEnd":function(queue){}          
        ,"workAdd":function(item,queue){}     
        ,"workResolve":function(value,queue){} 
        ,"workReject":function(reason,queue){} 
        ,"workFinally":function(queue){}       
        ,"retry":3                                    
        ,"retryIsJump":true                           
        ,"timeout":2000                                  
    })
```

### Queue.Q / Queue.Promise
a Promise utils, See also [extend-promise#类扩展](https://github.com/cnwhy/extend-promise#类扩展)  
Note: The prototype is not expanded with [extend-promise][github-extend-promise];

### Queue.use(Promise) , Queue.createUse(Promise)
Modify the internal use of Promise , the default use of [bluebird][github-bluebird]    
- `Queue.use(Promise)` use `Promise`;  
- `Queue.createUse(Promise)` return new Class use `Promise`;  

```javascript
var Queue = require("promise-queue-plus") //default use of bluebird
Queue.Promise.defer().promise instanceof Promise; //false
//use ES6 Promise
Queue.use(Promise);  
Queue.Promise.defer().promise instanceof Promise; //true
var queue1 = new Queue(1);
queue1.push(function(){}) instanceof Promise; //true;

//Create a new class `NQueue`, does not affect the original` Queue`;
var NQueue = Queue.createUse(require("q")); //use q module
```

  
### queue.push(promisefun, *args[]*, *options*)  
add job (FIFO)
- `promisefun` promise function
- `args` arguments 
about options like:
```js
queue.push(function(a,b){return a+b;},[1,2],{
    "workResolve":false                    //1. Queue events are not executed
    ,"workReject":function(reason,queue){} //2. Are executed
    ,"workFinally":function(queue){return false;} //3. if return false,Queue events are not executed
    ,"retry":0                                 //Override the queue settings
    ,"retryIsJump":false                        //Override the queue settings
    ,"timeout":0                               //Override the queue settings
});
```


### queue.unshift(promisefun, *args[]*, *options*)
add job (LIFO)  

### queue.go(promisefun, *args[]*, *options*)  
like `push` and start queue  

### queue.jump(promisefun, *args[]*, *options*)  
like `unshift` and start queue  

### queue.add(executor, *options*, *start*, *jump*)  
- `executor` like the `new Promise(executor)`
- `options` like 'options' for `push` 
- `start` Whether to start immediately
- `jump`  Whether the LIFO mode

```js
queue.add(function(resolve, reject){
    resolve(1);
},true).then(console.log,console.error)
//output 1;
```

### queue.addArray(arr,*start*,*jump*)  
Add multiple jobs with Array, promise value as Array;
- `arr`   arguments Array
- `start` Whether to start immediately
- `jump`  Whether the LIFO mode

```js
queue.addArray([
    [function(a){return a},[1],{}],
    [function(a,b){return a+b;},[1,2],{}]
],true).then(console.log,console.error);
//output [1,3]
```

### queue.addProps(props,*start*,*jump*)  
Add multiple jobs with Array, promise value as Map;
- `props` arguments Map 
- `start` Whether to start immediately
- `jump`  Whether the LIFO mode

```js
queue.addProps({
    a:[function(a){return a},[1]],
    b:[function(a,b){return a+b;},[1,2]]
},true).then(console.log,console.error);
//output {a:1,b:3}
```

### queue.addLikeArray(arrArgs[],promisefun,*options*,*start*,*jump*)  
Syntax for 'addArray' sugar 

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
like `queue.addLikeArray`,To "promisefun" pass parameters similar to "forEach" (element, index, arrArgs)

```js
function fn(v,i,arr){
    return i + " : " + v;
}
queue.addLikeArrayEach([1,[1,2]],fn,true).then(console.log,console.error);
//output [ '0 : 1', '1 : 1,2' ]
```

### queue.addLikeProps (props,promisefun,*options*,*start*,*jump*)  
Syntax for 'addProps' sugar 

### queue.addLikePropsEach (props,promisefun,*options*,*start*,*jump*)
like `queue.addLikeProps`,To "promisefun" pass parameters similar to "forEach" (value, key, props)

### queue.start()
start queue;

### queue.stop()
stop queue;

### queue.clear(reason)  
clear queue,The rest of the queue will be rejected with `reason`;

### queue.option(name, *value*)  
Set/Get queue `options`

### queue.getMax()
Get MaxNumber Concurrent;

### queue.setMax(newMax)
Set MaxNumber Concurrent;

### queue.getLength() 
Queue remaining job count;

### queue.getRunCount()
Queue running job count;

### queue.isStart()

### queue.onError = function(err){}
Queue other error handling

## About the browser  
Because `bluebird` too big, Of browsers use [easy-promise][github-easy-promise] instead of [bluebird][github-bluebird];  
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
