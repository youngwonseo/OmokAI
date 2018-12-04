var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    socketio = require('socket.io'),
    redis = require('redis');




var redisClient = redis.createClient(6379,'IP',{password:'1111'});
// app.use(function(req,res,next){
//     req.cache = redisClient;
//     next();
// })



app.use('/', express.static('public'));
app.set('view engine','ejs')
app.use(bodyParser.urlencoded({extended:false}));

app.get('/',function(req,res){
    res.render('index');
})

app.post('/',function(req,res){
    res.redirect('/');
});

var server = app.listen(8003);
var io = socketio.listen(server);

var toggle = true;
var board = {}


var CHECK_OMOK_X = [-1, 0, 1, 1];
var CHECK_OMOK_Y = [-1,-1,-1, 0];

io.sockets.on('connection',function(socket){

    //console.log(socket);
    redisClient.lrange('game',0,-1,function(err,data){
        data.forEach(function(value,index,ar){
            io.sockets.emit('draw',JSON.parse(value));
        });
        //data = JSON.parse([data]);
       
    });

    
    socket.on('go',function(data){
        var pos = data.x+','+data.y;
        if(pos in board)
            return;



        //현재 색상
        data.color = toggle ? 'black':'white';
        console.log(data.color)


        //check win?
        redisClient.lrange('game',0,-1,function(err,datas){
            var board = {};

            //기존의 돌
            datas.forEach(function(value,index,ar){
                var temp = JSON.parse(value);
                board[temp.x + ','+temp.y] = temp.color;
            });

            board[data.x+','+data.y] = data.color;
            
            data.isWin = false;
            var curX = 0;
            var curY = 0;
   
            for(var i=0; i<4; i++){
                var numOfStone = 0;

                for(var j=5; j>-6; j--){
                    curX = data.x + CHECK_OMOK_X[i] * j;
                    curY = data.y + CHECK_OMOK_Y[i] * j;

                    if(curX < 0 || curY < 0 || curX > 18 || curY > 18){
                        continue;
                    }

                    
                    
                    if(board[curX+','+curY] && board[curX+','+curY] == data.color){
                        numOfStone++;
                    }else if(board[curX+','+curY] && board[curX+','+curY] != data.color){
                        numOfStone = 0;
                    }

                    if(numOfStone == 5){
                        console.log(numOfStone);
                        console.log('win')
                        data.isWin = true;
                    }
                }
            }
            
        });



        
        console.log('저장')
        redisClient.lpush('game',JSON.stringify(data), function(err, reply) {
            //console.log(reply); //prints 2
        });



        

        
        

        //console.log(data);
        //socket.broadcast.emit('go',data);
        toggle = !toggle;
        io.sockets.emit('draw',data);
    });


    socket.on('reset',function(data){
        
    });
});



io.sockets.on('disconnection',function(){

});