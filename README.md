lib-queue
=====

事件队列控制模块  

Promise模式

new queue.Promise(maxleng,srr,err,begin,end)

//队列控制  
.go(fun) //添加并执行  
.play()  //执行  
.push(fun) //向尾部添加执行单元  
.unshift(fun) //向头部添加执行单元  
.clear()  //清除执行队列  
.setMax(max,noplay)  动太修改最大并行数



