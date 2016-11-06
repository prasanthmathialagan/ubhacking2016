var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var Twitter = require('twitter');

var curators = [];
var curator_sockets = [];
var sockets_to_rooms = new Map();

var client = new Twitter({
   consumer_key: 'rnkH5fxqVdwevxOFj63lPUIjX',
   consumer_secret: 'zXmUisyQicPgJ85WhQwh3Q3LBQi7zp1nK7C18xgt2suGPIvicK',
   access_token_key: '3299764856-L9RuDmOX4LHUqmkLotuC8lXkfyBNxvy7bnRJIYC',
   access_token_secret: 'ufEW8qeafQSQrmAQWEtFh42vfnkR7YV7tda5m1kB3QGZG'
 });

var send_updated_viewers_count = function(io, room_name){
	console.log('Updating viewers count in the room ' + room_name);
  	var room = io.sockets.adapter.rooms[room_name];
	var viewers = room.length - 1;
	console.log('Current viewers in the room ' + room_name + ' = ' + viewers);

	io.to(room_name).emit('update viewers', viewers);
}

var express = require('express');
app.use('/js', express.static(__dirname + '/js'));
app.use('/css', express.static(__dirname + '/css'));
app.use('/fonts', express.static(__dirname + '/fonts'));
app.use('/img', express.static(__dirname + '/img'));
app.use('/font-awesome', express.static(__dirname + '/font-awesome'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/main.html');
});

app.get('/curatorpage', function(req, res){
  res.sendFile(__dirname + '/clientMixer/index.html');
});

app.get('/viewerpage', function(req, res){
  res.sendFile(__dirname + '/client_viewer/client_viewer.html');
});

app.get('/curators',function (req, res) {
  res.sendFile(__dirname + '/client_viewer/index.html');
});

app.get('/gettweets/:query',function(req,res){
  client.get('search/tweets', {q: req.params.query}, function(error, tweets, response) {
   // console.log(JSON.stringify(tweets));
   // var obj = JSON.parse(tweets);
    //var result={};
    //var i=0;
   /* for (i=0;i< obj.length;i++)
    {
       if (obj[i].hasOwnProperty(expanded_url))
       {
          result.push(obj[i].expanded_url);
       }
     }*/
    // console.log(obj['statuses'].expanded_url);
     res.write(JSON.stringify(tweets));
     res.end();
   
  });
});

var update_sockets_map = function(socket, room_name){
	socket.join(room_name);
    sockets_to_rooms.set(socket, room_name);
}

var can_register = function(socket){
	if(sockets_to_rooms.has(socket)){
  		if(curator_sockets.indexOf(socket) != -1) {
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
  	if(!can_register(socket))
  		return;

    var obj = JSON.parse(msg);
    var room_name = obj.name;
    update_sockets_map(socket, room_name);
    console.log('Curator with name = ' + obj.name + ' created a room ' + room_name);

    curators.push(obj);
    curator_sockets.push(socket);
  });

  // Register to feed
  socket.on('register viewer', function(msg){
   	if(!can_register(socket))
  		return;

    var obj = JSON.parse(msg);
    var room_name = obj.name;
    
    update_sockets_map(socket, room_name);
    console.log('Viewer joined the room ' + room_name);

    send_updated_viewers_count(io, room_name);
  });

  socket.on('publish video', function(msg){
    console.log('Video to be published : ' + msg);
    var room_name = sockets_to_rooms.get(socket);
    io.to(room_name).emit('publish video', msg);
  });

  socket.on('get curators', function(msg){
    console.log('get curators called');
   	var obj = {};
    obj['curators'] = curators;
    socket.emit('post curators', JSON.stringify(obj));
  });
  
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
