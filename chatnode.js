var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var path = require('path');


server.listen(4200);

var router = express.Router();

router.get('/home', function(req, res){
  res.sendfile('./chatapp.html');
});

app.use(express.static(path.join(__dirname, 'js')));

var usernames = {};
var rooms = ['room1'];
var counter=0;
io.sockets.on('connection', function (socket) {

	socket.on('adduser', function(){
		counter++;
		var username = 'user'+ counter;
		console.log("username is", username);
		socket.username = username;
		socket.room = 'room1';
		usernames[username] = username;
		socket.join('room1');
		socket.emit('username',socket.username);
		socket.emit('updatechat', socket.username, 'you have connected to room1');
		socket.broadcast.to(socket.room).emit('updatechat', username , ' has connected to this room');
		socket.emit('updaterooms', rooms, 'room1');
	});

	socket.on('sendchat', function (data) {
		console.log("entered the send message", data, socket.room, socket.username);
		io.sockets.in(socket.room).emit('updatechat', socket.username, data);
	});

	socket.on('editname', function(newname) {
		console.log("entered the name editing section", newname, 'from ',socket.username);
		var oldname = socket.username;
		socket.username = newname;
		username = socket.username;
		usernames[username] = username;
		io.sockets.in(socket.room).emit('updatechat', oldname, ''+socket.username + ' is the new name for this user');
	});

	socket.on('switchRoom', function(newroom){
		console.log("entered the switch room section");
		socket.leave(socket.room);
		console.log("index of the value in rooms array is"+ rooms.indexOf(newroom), newroom, typeof(newroom));
		if(rooms.indexOf(newroom) == -1) {
			rooms.push(newroom);
		} else {
			console.log("already room in array");
		}
		socket.join(newroom);
		socket.emit('updatechat', 'SERVER', 'you have connected to '+ newroom);
		socket.broadcast.to(socket.room).emit('updatechat', socket.username , ' has left this room');
		io.sockets.in(socket.room).emit('updaterooms', rooms, socket.room);

		socket.room = newroom;
		io.sockets.in(socket.room).emit('updaterooms', rooms, newroom);
		socket.broadcast.to(newroom).emit('updatechat',  socket.username, ' has joined this room');
	});

	socket.on('disconnect', function(){
		delete usernames[socket.username];
		io.sockets.emit('updateusers', usernames);
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
		socket.leave(socket.room);
	});
});


app.use('/', router);


app.listen(8081, function(){
  console.log('listening on *:8081');
});
