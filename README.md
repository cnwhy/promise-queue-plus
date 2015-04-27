lib-queue
=====

事件队列控制模块  

Promise模式
var Queue = require('lib-queue').Promise(1);
var queue = new Queue.Promise(maxleng)

//队列控制
.push(fun,args,con) //向尾部添加执行单元  
.go(fun,args,con) //向尾部添加执行单元 并执行 
.unshift(fun,args,con) //向头部添加执行单元  
.jump(fun,args,con) //向头部添加执行单元 并优先执行 

.start()  //开始执行
.clear()  //清除执行队列  
.setMax(max,noplay)  动态修改最大并行数



