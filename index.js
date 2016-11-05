var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var curators = [];
var curator_sockets = [];
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

app.get('/curators',function (req, res) {
  res.write(JSON.stringify({"Curators":curators}));
  res.end();
});

io.on('connection', function(socket){
  console.log('a user connected');
  
  // Register viewer
  socket.on('register curator', function(msg){
    var obj = JSON.parse(msg);
    obj.id = id_counter;
    id_counter++;

    var room_name = obj.id + "";
    var room = io.sockets.in(room_name);
    room.on('leave', function() {
    	console.log('Leaving the room');
    	send_updated_viewers_count(io, room_name);
	});

    socket.join(room_name);
    console.log('Curator with name = ' + obj.name + ', id = ' + obj.id + ' created a room ' + obj.id);

    curators.push(obj);
    curator_sockets.push(socket);
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

    var i = curator_sockets.indexOf(socket);
    if(i != -1){
    	console.log("Removing the curator from the index " + i);
    	curator_sockets.splice(i, 1);
    	curators.splice(i, 1);
    }
  });

});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
