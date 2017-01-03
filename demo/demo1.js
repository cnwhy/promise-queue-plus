var Queue = require('../');
var q = Queue.Q;  //配合使用的Promise流程控制类，也可以使用原生Promise也可以用q.js,等实现Prmise的类库

//实列化一个最大并发为1的队列
var queue1 = new Queue(1); 

//定义一个Promise风格的异步方法
function testfun(i){
    return new Promise(function(resolve,reject){
        setTimeout(function(){
            resolve(i)
        },300)
    })
}
var log = function(msg){ console.log(msg); }

queue1.push(testfun,[1]) //向队列添加运行单元
.then(console.log); 

queue1.push(function(){return 2;}) //插入普通方法会按Promises/A+规则反回promise
.then(console.log);

queue1.unshift(testfun,[0]) //插入优先执行项 (后进先出)
.then(console.log);

queue1.addLikeArray([3,4],testfun,{'event_item_resolve':log}) //插入多个运行项 array,完成一项,将执行一次log方法
.then(console.log) 

queue1.addLikeProps({'a':5,'b':6,'c':7},testfun,{'event_item_resolve':log}) //插入多个运行项 map , 最后的promise值也是一个对应map
.then(console.log)

var v = 0;
queue1.push(function(){
    if(++v<8) throw "err";
    return testfun(v);
},{
    retry:10 //设置重试次数
    ,retry_type:true //重试模式为优先
}).then(console.log)

//queue1.start(); //执行队列
queue1.go(testfun,['go']).then(console.log) 





