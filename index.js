var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');

var curators = [];
var curator_sockets = [];
var id_counter = 0;
var sockets_to_rooms = new Map();

const VIEWER_URL = __dirname + '/client_viewer/client_viewer.html';

var send_updated_viewers_count = function(io, room_name){
	console.log('Updating viewers count in the room ' + room_name);
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

app.get('/broadcast_channel/:id',function(req, res) {
  var data = fs.readFileSync(VIEWER_URL, "utf8");
  console.log(JSON.stringify(req.params) + "   " + req.params.id);
  res.write(data.replace('$ROOM', req.params.id));
  res.end();
})

var update_sockets_map = function(socket, room_name){
	socket.join(room_name);
    sockets_to_rooms.set(socket, room_name);
}

var can_register = function(socket){
	if(sockets_to_rooms.has(socket)){
  		if(curator_sockets.indexOf(socket) != 1) {
  			console.error('Already registered as a curator!!!!');
  		}
  		else {
  			console.error('Already registered as a viewer!!!!');
  		}
  		return false;
  	}
  	return true;
}

io.on('connection', function(socket){
  console.log('a user connected');
  
  // Register viewer
  socket.on('register curator', function(msg){
    var obj = JSON.parse(msg);
    obj.id = id_counter;
    id_counter++;

    var room_name = obj.id + "";

    update_sockets_map(socket, room_name);

    console.log('Curator with name = ' + obj.name + ', id = ' + obj.id + ' created a room ' + obj.id);

    curators.push(obj);
    curator_sockets.push(socket);
  });

  // Register to feed
  socket.on('register viewer', function(msg){
    var obj = JSON.parse(msg);
    var room_name = obj.id + "";
    
    update_sockets_map(socket, room_name);
    console.log('Viewer joined the room ' + room_name);

    send_updated_viewers_count(io, room_name);
  });

  /*socket.on('publish video', function(msg){
    console.log('message: ' + msg);
    socket.broadcast.emit('chat message', msg);
    // io.to('1').emit('chat message', msg);
  });*/
  
  socket.on('chat message', function(msg){
    console.log('message: ' + msg);
    socket.broadcast.emit('chat message', msg);
    // io.to('1').emit('chat message', msg);
  });

  socket.on('disconnect', function(){
    console.log('user disconnected');

    var room_name = sockets_to_rooms.get(socket);
    if(room_name){
    	sockets_to_rooms.delete(socket);
    }
    else {
    	console.log("There is no room associated with the socket");
    }

    var i = curator_sockets.indexOf(socket);
    if(i != -1){ // Curator
    	console.log("Removing the curator from the index " + i);
    	curator_sockets.splice(i, 1);
    	curators.splice(i, 1);
    }
    else { // Viewer
    	if(room_name){
    		send_updated_viewers_count(io, room_name);	
    	}
    }
  });

});

http.listen(3000, "0.0.0.0", function(){
  console.log('listening on *:3000');
});
