const MESSAGE = require('../common/message');
const User = require('../common/user');
const CliAdapter = require('./game-room').ClientAdapter;
const Schema = require('./schema');
const Lobby = require('./lobby');
const GAME_PHASE = require('../common/game-phase');
const GameError = require('./game-error');

function debugLog(str) {
	if (process.env.NODE_ENV !== 'production') {
		console.log(str);
	}
}

function handleSockets(io) {
	io.on('connection', function(sock) {
		debugLog('Socket connected: ' + sock.id);
		Object.keys(MessageHandlers).forEach((messageName) => {
			sock.on(messageName, function(data) {
				try {
					Schema.validateMessageFromClient(messageName, data);
					MessageHandlers[messageName](io, sock, data);
				} catch(e) {
					// REMEMBER, any code/mutations inside the try before the error do still execute
					if(e.name === GameError.name) {
						sock.emit(messageName, {
							err: e.clientMessage,
						});
					} else {
						throw e;
					}
				}
			});
		});
	});
}

const MessageHandlers = {
	[MESSAGE.CREATE_ROOM](io, sock, data) {
		GamePrecond.sockDoesNotHaveUser(sock);
		GamePrecond.lobbyIsNotFull();

		let user = login(sock, data.username);
		let newRoom = Lobby.createRoom();

		joinRoom(user, newRoom, false, true);

		io.in(newRoom.roomCode).emit(MESSAGE.CREATE_ROOM, {
			username: user.name,
			roomState: CliAdapter.generateStateJson(newRoom),
		});
	},

	[MESSAGE.JOIN_ROOM](io, sock, data) {
		let roomToJoin = Lobby.getRoomByCode(data.roomCode);

		GamePrecond.sockDoesNotHaveUser(sock);
		GamePrecond.roomExists(data.roomCode);

		let user;

		if(data.rejoin) {
			GamePrecond.nameIsTakenInRoom(data.username, roomToJoin);
			GamePrecond.gameInProgress(roomToJoin);
			user = login(sock, data.username, roomToJoin);
			joinRoom(user, roomToJoin, true, false);
		} else {
			GamePrecond.roomIsNotFull(roomToJoin);
			GamePrecond.gameNotInProgress(roomToJoin);
			GamePrecond.nameIsNotTakenInRoom(data.username, roomToJoin);
			user = login(sock, data.username);
			joinRoom(user, roomToJoin, false, false);
		}
		broadcastRoomState(io, roomToJoin, MESSAGE.JOIN_ROOM);
	},

	[MESSAGE.LEAVE_ROOM](io, sock, data) {
		GamePrecond.sockHasUser(sock);
		GamePrecond.userIsInARoom(sock.user);
		let user = sock.user;
		let room = user.gameRoom;
		logout(sock);

		sock.emit(MESSAGE.LEAVE_ROOM, {});
		// also, tell other players in room that this player has left
		broadcastRoomState(io, room, MESSAGE.USER_LEFT, (res) => {
			res.username = user.name;
			return res;
		});
	},

	[MESSAGE.JOIN_TEAM](io, sock, data) {
		let team = data.team;
		let user = sock.user;
		let room = user.gameRoom;
		joinTeam(user, room, team);
		broadcastRoomState(io, room, MESSAGE.JOIN_TEAM);
	},

	[MESSAGE.START_GAME](io, sock, data) {
		GamePrecond.sockHasUser(sock);
		GamePrecond.userIsInARoom(sock.user);
		GamePrecond.allPlayersInTeam(sock.user.gameRoom);
		let rm = sock.user.gameRoom;
		rm.startNewRound();
		broadcastRoomState(io, rm, MESSAGE.START_GAME);
	},

	[MESSAGE.SKIP_ROUND](io, sock, data) {
		GamePrecond.sockHasUser(sock);
		GamePrecond.userIsInARoom(sock.user);
		let rm = sock.user.gameRoom;
		rm.startNewRound();
		broadcastRoomState(io, rm, MESSAGE.START_GAME);
	},

	[MESSAGE.SUBMIT_STROKE](io, sock, data) {
		GamePrecond.sockHasUser(sock);
		GamePrecond.userIsInARoom(sock.user);
		GamePrecond.gameInProgress(sock.user.gameRoom);
		GamePrecond.isUsersTurn(sock.user);
		let rm = sock.user.gameRoom;
		rm.addStroke(sock.user.name, data.points);
		rm.nextTurn();
		broadcastRoomState(io, rm, MESSAGE.NEW_TURN);
	},

	[MESSAGE.SUBMIT_CARDS](io, sock, data) {
		GamePrecond.sockHasUser(sock);
		GamePrecond.userIsInARoom(sock.user);
		GamePrecond.gameInProgress(sock.user.gameRoom);
		let rm = sock.user.gameRoom;
		rm.addCards(data.cards);
		sock.user.setCardsChosen(true);
		broadcastRoomState(io, rm, MESSAGE.SUBMIT_CARDS);
	},

	[MESSAGE.RETURN_TO_SETUP](io, sock, data) {
		GamePrecond.sockHasUser(sock);
		GamePrecond.userIsInARoom(sock.user);
		let rm = sock.user.gameRoom;
		rm.invokeSetup();
		broadcastRoomState(io, rm, MESSAGE.RETURN_TO_SETUP);
	},

	[MESSAGE.TURN_START](io, sock, data) {
		GamePrecond.gameInProgress(sock.user.gameRoom);
		let rm = sock.user.gameRoom;
		rm.turnStart();
		broadcastRoomState(io, rm, MESSAGE.TURN_START);
	},

	[MESSAGE.NEXT_CARD](io, sock, data) {
		GamePrecond.gameInProgress(sock.user.gameRoom);
		let rm = sock.user.gameRoom;
		rm.nextCard(data.correct);
		broadcastRoomState(io, rm, MESSAGE.NEXT_CARD);
	},

	[MESSAGE.TURN_END](io, sock, data) {
		GamePrecond.gameInProgress(sock.user.gameRoom);
		let rm = sock.user.gameRoom;
		rm.turnEnd();
		broadcastRoomState(io, rm, MESSAGE.TURN_END);
	},

	disconnect(io, sock, data) {
		let user = sock.user;
		if(user) {
			let room = user.gameRoom;
			logout(sock);
			if(room) {
				console.log(`Disconnect: ${user.logName} from room-${room.roomCode}`);
				broadcastRoomState(io, room, MESSAGE.USER_LEFT, (res) => {
					res.username = user.name;
					return res;
				});
			}
		}
	},
};

function login(sock, username, roomToRejoin) {
	username = username.trim();
	let user;
	if(roomToRejoin) {
		debugLog(`Attempt reconnect: <${username}>`);
		user = roomToRejoin.findUser(username);
		user.socket = sock;
	} else {
		user = new User(sock, username);
	}
	sock.user = user;
	debugLog(`Login: ${user.logName}`);
	return user;
}
function logout(sock) {
	let user = sock.user;
	if(user) {
		sock.user = undefined;
		user.socket = undefined;

		let room = user.gameRoom;
		if(room) {
			sock.leave(room.roomCode);
			if(room.phase === GAME_PHASE.SETUP) {
				// if room has no game yet, remove the user from the room completely
				room.dropUser(user);
				console.log(`Left: ${user.logName} from room-${room.roomCode}. Room users: ${room.users.length}`);
			} else {
				debugLog(`Logout ${user.logName}`);
			}
			if(room.isDead()) {
				console.log(`Triggering delayed room teardown for room-${room.roomCode}`);
				Lobby.triggerDelayedRoomTeardown(room);
			}
		}
	}
}

function joinRoom(user, room, rejoin, isHost = false) {
	if(rejoin) {
		room.readdUser(user);
		console.log(`Rejoin: ${user.logName} to room-${room.roomCode}`);
	} else {
		room.addUser(user, isHost);
		console.log(`Join: ${user.logName} to room-${room.roomCode}. Room users: ${room.users.length}`);
	}
	user.socket.join(room.roomCode);
	user.setGameRoom(room);
	return room;
}

function joinTeam(user, room, team) {
	user.setTeam(team);
	console.log(`${user.logName} joined team ${team} in room-${room.roomCode}`);
	return user;
}

const GamePrecond = {
	sockHasUser(sock) {
		if(sock.user === undefined) {
			throw new GameError('No user');
		}
	},
	sockDoesNotHaveUser(sock) {
		if(sock.user !== undefined) {
			throw new GameError('Must not have user');
		}
	},
	userIsInARoom(user) {
		if(user.gameRoom === undefined) {
			throw new GameError(`User ${user.name} should be in a room`, 'User must be in a room');
		}
	},
	userIsNotInARoom(user) {
		if(user.gameRoom !== undefined) {
			throw new GameError('User must not be in a room. User is in room ' + user.gameRoom, 'User must not be in a room');
		}
	},
	roomExists(roomCode) {
		if(Lobby.getRoomByCode(roomCode) === undefined) {
			throw new GameError(`Room-${roomCode} DNE`, 'This room is unavailable');
		}
	},
	gameInProgress(room) {
		if(!room.gameInProgress()) {
			throw new GameError('Game must be in progress');
		}
	},
	gameNotInProgress(room) {
		if(room.gameInProgress()) {
			throw new GameError('A game is already in progress');
		}
	},
	roomIsNotFull(room) {
		if(room.isFull()) {
			throw new GameError(`Room ${room.roomCode} is full`, 'This room is full');
		}
	},
	lobbyIsNotFull() {
		if(Lobby.isFull()) {
			throw new GameError('The lobby is at max capacity');
		}
	},
	isUsersTurn(user) {
		let room = user.gameRoom;
		if(room.whoseTurn() !== user) {
			throw new GameError("Not user's turn");
		}
	},
	nameIsNotTakenInRoom(username, room) {
		if(room.findUser(username)) {
			throw new GameError(`Username ${username} is taken in room ${room.roomCode}`, "This username is taken in this room");
		}
	},
	nameIsTakenInRoom(username, room) {
		if(room.findUser(username) === undefined) {
			throw new GameError(`Username ${username} DNE in room ${room.roomCode}`, "This username doesn't exist in this room");
		}
	},
	allPlayersInTeam(room) {
		if (room.hasUnassignedPlayers()) {
			throw new GameError(`Room ${room.roomCode} has unassigned players`, 'Not all players have joined a team');
		}
	}
};

// send roomstate update to all users, accounting for different roles (i.e., faker vs artist)
function broadcastRoomState(io, room, messageName, addtlProcessFn) {
	let state = CliAdapter.generateStateJson(room);
	if (addtlProcessFn) {
		state = addtlProcessFn(state);
	}

	if (room.phase === GAME_PHASE.SETUP) {
		io.in(room.roomCode).emit(messageName, {
			roomState: state,
		});
		return;
	}
	for (let u of room.users) {
		let s = u.socket;
		if (u.socket === undefined) {
			continue;
		}

		let res = {
			roomState: state
		};
		s.emit(messageName, res);
	}
}

module.exports = handleSockets;