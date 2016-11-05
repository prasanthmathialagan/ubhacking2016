var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var curators = [];
var id_counter = 0;

var send_updated_viewers_count = function(io, room_name){
  	var room = io.sockets.adapter.rooms[room_name];
	var viewers = room.length - 1;
	console.log('Current viewers in the room ' + room_name + ' = ' + viewers);

	io.to(room_name).emit('update viewers', viewers);
}

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
    var room_name = obj.id + "";
    socket.join(room_name);
    console.log('Viewer joined the romm ' + room_name);

    send_updated_viewers_count(io, room_name);
  });
  
  socket.on('chat message', function(msg){
    console.log('message: ' + msg);
    socket.broadcast.emit('chat message', msg);
    // io.to('1').emit('chat message', msg);
  });

  socket.on('disconnect', function(){
    console.log('user disconnected');

    // Update viewer count
  });

  // get curators
  socket.on('get curators', function(){
    console.log('get curators called');

  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
