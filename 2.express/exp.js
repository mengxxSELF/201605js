var path = require('path');
var url = require('url');

//导出一个函数 express
module.exports = function(){
   //当调用此函数的时候返回一个函数，就是监听函数，有两个参数,分别是请求和响应
   var app =  function(req,res){
     //把url转换成对象
     var urlObj =  url.parse(req.url);
     //获取请求中的方法名 方法名要从大写转成小写
     var method = req.method.toLowerCase();
     //取得路径名
     var pathname = urlObj.pathname;
     var index = 0;
     function next(){
         var layer = app.layers[index++];
         if(layer.type == 'middleware'){//中间件
             if(pathname.startsWith(layer.path)){
                 //执行对应的监听函数
                 layer.listener(req,res,next);
             }
         }else{//路由
             if((layer.method== 'all' || method == layer.method) && (layer.path == pathname|| layer.path == '*')){
                 //执行对应的监听函数
                 layer.listener(req,res);
                 //如果已经当前路由对象和当前请求已经成功配对，则不再继续匹配
                 return ;
             }
         }
     }
     next();

       //循环保存在数组的每个路由配置对象
     for(var i=0;i<app.layers.length;i++){
         //取出当前的路由
        var route = app.layers[i];
         //如果方法名相同并且路径相当的话，就可以执行对应的回调函数了
        if((route.method== 'all' || method == route.method) && (route.path == pathname|| route.path == '*')){
            //执行对应的监听函数
            route.listener(req,res);
            //如果已经当前路由对象和当前请求已经成功配对，则不再继续匹配
            break;
        }
     }
   }
    //app内部维护了一个监听数组，是一个路由数组
   app.layers = [];
    //为app增加自定义属性，第一个参数是路径，第二个参数是请求监听函数
   var methods = ['all','get','post','delete','head','put'];
   methods.forEach(function(method){
        app[method] = function(path,listener){
            //向数组中增加新的元素，是一个配置对象，由路径和监听函数组成
            app.layers.push({type:'route',method:method,path:path,listener:listener});
        }
    })
    app.use = function(path,middleware){
        if(typeof path == 'function'){
            middleware = path;
            path = '/';
        }
        app.layers.push({type:'middleware',path:path,listener:middleware});
    }
    //启动一个服务器，并且把自己作为监听函数传进去,再在port上监听客户端的请求
    app.listen = function (port) {
        require('http').createServer(app).listen(port);
    };
   return app;
}