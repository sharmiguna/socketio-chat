// var app = require('express').createServer();
// var io = require('socket.io').listen(app);

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

app.use(express.static(path.join(__dirname, 'js')));


app.listen(8081, function(){
  console.log('listening on *:8081');
});

app.get('/home', function(req, res){
  res.sendfile('./sample.html');
});

var usernames = {};
var rooms = ['room1','room2','room3'];

io.sockets.on('connection', function (socket) {

	socket.on('adduser', function(username){
		socket.username = username;
		socket.room = 'room1';
		usernames[username] = username;
		socket.join('room1');
		socket.emit('updatechat', 'SERVER', 'you have connected to room1');
		socket.broadcast.to('room1').emit('updatechat', 'SERVER', username + ' has connected to this room');
		// socket.emit('updaterooms', rooms, 'room1');
	});

	socket.on('sendchat', function (data) {
		io.sockets.in(socket.room).emit('updatechat', socket.username, data);
	});

	socket.on('switchRoom', function(newroom){
		socket.leave(socket.room);
		socket.join(newroom);
		socket.emit('updatechat', 'SERVER', 'you have connected to '+ newroom);
		socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username+' has left this room');
		socket.room = newroom;
		socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username+' has joined this room');
		// socket.emit('updaterooms', rooms, newroom);
	});

	socket.on('disconnect', function(){
		delete usernames[socket.username];
		io.sockets.emit('updateusers', usernames);
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
		socket.leave(socket.room);
	});
});