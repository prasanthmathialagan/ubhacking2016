var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var curators = [];
var id_counter = 0;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  console.log('a user connected');
  
  // Register viewer
  socket.on('register curator', function(msg){
    var obj = JSON.parse(msg);
    obj.id = id_counter;
    id_counter++;

    socket.join(obj.id + "");
    console.log('Curator with name = ' + obj.name + ', id = ' + obj.id + ' created a romm ' + obj.id);
  });

  // Register to feed
   socket.on('register viewer', function(msg){
    var obj = JSON.parse(msg);
    socket.join(obj.id + "");
    console.log('Viewer joined the romm ' + obj.id);
  });

  // socket.on('join', function(msg){
  //   console.log('join room: ' + msg);
  //   socket.join(msg);
  // });
  
  socket.on('chat message', function(msg){
    console.log('message: ' + msg);
    socket.broadcast.emit('chat message', msg);
    // io.to('1').emit('chat message', msg);
  });

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

  // get curators
  socket.on('get curators', function(){
    console.log('get curators called');

  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
