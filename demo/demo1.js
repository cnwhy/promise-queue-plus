var Queue = require('../');
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

queue1.add(function(resolve,reject){
    resolve(8)
}).then(log) 

queue1.go(testfn,['go']).then(log) 


