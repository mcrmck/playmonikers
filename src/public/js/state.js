const MESSAGE = require('../../common/message');
const socket = io();
const VIEW = require('./view');
const ClientGame = require('../../common/cli-game');
const Util = require('../../common/util');
const GAME_PHASE = require('../../common/game-phase');
const CONNECTION_STATE = require('./connection-state');

const Store = {
	state: {
		username: '',
		team: '',
		view: VIEW.HOME,
		previousView: VIEW.HOME,
		gameState: undefined,
		createWarning: undefined,
		joinWarning: undefined,
		startWarning: undefined,
		gameConnection: CONNECTION_STATE.DISCONNECT
	},
	setUsername(username) {
		this.state.username = username.trim();
	},
	setView(view) {
		this.state.previousView = this.state.view;
		this.state.view = view;
	},
	setTeam(team) {
		this.state.team = team;
	},
	setGameState(newGameState) {
		if(newGameState === undefined) {
			this.state.gameState = undefined;
			this.setGameConnection(CONNECTION_STATE.DISCONNECT);
			this.setView(VIEW.HOME);
			return;
		}
		this.setGameConnection(CONNECTION_STATE.CONNECT);

		if(this.state.gameState === undefined) {
			this.state.gameState = ClientGame.generateClientGameState();
		}
		this.state.gameState.adoptJson(newGameState);

		if(this.state.gameState.phase === GAME_PHASE.SETUP) {
			this.setView(VIEW.SETUP);
		} else if(this.state.gameState.phase === GAME_PHASE.PLAY || this.state.gameState.phase === GAME_PHASE.VOTE) {
			this.setView(VIEW.GAME);
		}
	},
	setGameConnection(cs) {
		this.state.gameConnection = cs;
	},
	myTurn() {
		return this.state.gameState
			&& this.state.gameState.whoseTurn === this.state.username
			&& this.state.gameState.phase === GAME_PHASE.PLAY;
	},
	setWarning(warningName, message) {
		this.state[warningName] = message;
	},
	getSocket() {
		return socket;
	},
	submitCreateGame,
	submitJoinGame,
	submitLeaveGame,
	submitJoinTeam,
	submitStartGame,
	submitStroke,
	submitSkipRound,
	submitReturnToSetup,
	submitCards,
	submitTurnStart,
	submitNextCard,
	submitTurnEnd
};

function handleSocket(messageName, handler, errHandler) {
	socket.on(messageName, function(data) {
		if(data.err) {
			console.warn(data.err);
			if(errHandler) {
				errHandler(data.err);
			}
			return;
		}
		if(handler) {
			handler(data);
		}
		if(data.roomState !== undefined) {
			Store.setGameState(data.roomState);
		}
	});
}
handleSocket(MESSAGE.CREATE_ROOM,
	function(data) {
		Store.setUsername(data.username);
	},
	function(errMsg) {
		Store.setWarning('createWarning', errMsg);
	}
);
handleSocket(MESSAGE.JOIN_ROOM,
	function(data) {
		if(data.username !== Store.state.username) {
			return;
		}
		Store.setWarning('joinWarning', undefined);
		if(data.rejoin === true) {
			console.log('Game reconnect success');
		}
	},
	function(errMsg) {
		Store.setWarning('joinWarning', errMsg);
	}
);
handleSocket(MESSAGE.JOIN_TEAM,
	function(data) {
		Store.setTeam(data.team);
	},
	function(errMsg) {
		Store.setWarning('joinTeamWarning', errMsg);
	}
);
handleSocket(MESSAGE.LEAVE_ROOM, function(data) {
	// let the socket disconnect handler take care of the rest
	// Store.setGameState(undefined);
});
handleSocket(MESSAGE.USER_LEFT);
handleSocket(MESSAGE.START_GAME,
	function(errMsg) {
		Store.setWarning('startWarning', errMsg);
	}
);
handleSocket(MESSAGE.NEW_TURN);
handleSocket(MESSAGE.SUBMIT_CARDS);
handleSocket(MESSAGE.RETURN_TO_SETUP);
handleSocket(MESSAGE.TURN_START);
handleSocket(MESSAGE.NEXT_CARD);
handleSocket(MESSAGE.TURN_END);

const usernameWarning = 'Username must be 1-20 characters long, and can only contain alphanumerics and spaces';
function submitCreateGame(username) {
	username = username.trim();
	if(Util.validateUsername(username)) {
		this.setWarning('createWarning', undefined);
		socket.emit(MESSAGE.CREATE_ROOM, {
			username: username,
		});
		return true;
	} else {
		this.setWarning('createWarning', usernameWarning);
		return false;
	}
}
function submitJoinGame(roomCode, username) {
	username = username.trim();
	if(Util.validateUsername(username)) {
		this.setWarning('joinWarning', undefined);
		socket.emit(MESSAGE.JOIN_ROOM, {
			roomCode: roomCode,
			username: username,
		});
		return true;
	} else {
		this.setWarning('joinWarning', usernameWarning);
		return false;
	}
}
function submitLeaveGame() {
	socket.emit(MESSAGE.LEAVE_ROOM, {});
}
function submitJoinTeam(team) {
	socket.emit(MESSAGE.JOIN_TEAM, {
		team: team,
	});
}
function submitStartGame(reds, blues, users) {
	if (reds.length - blues.length >= 2) {
		this.setWarning('startWarning', 'Red team has too many members');
	} else if (blues.length - reds.length >= 2) {
		this.setWarning('startWarning', 'Blue team has too many members');
	} else {
		socket.emit(MESSAGE.START_GAME, {});
	}
}
function submitStroke(points) {
	// socket.emit(MESSAGE.SUBMIT_STROKE, {
	// 	points: points,
	// });
	socket.emit(MESSAGE.SUBMIT_STROKE);
}
function submitSkipRound() {
	socket.emit(MESSAGE.SKIP_ROUND);
}
function submitReturnToSetup() {
	socket.emit(MESSAGE.RETURN_TO_SETUP);
}
function submitCards(cards) {
	socket.emit(MESSAGE.SUBMIT_CARDS, {
		cards: cards
	});
}
function submitTurnStart() {
	socket.emit(MESSAGE.TURN_START, {});
}
function submitNextCard(correct) {

	socket.emit(MESSAGE.NEXT_CARD, {
		correct: correct
	});
}
function submitTurnEnd() {
	socket.emit(MESSAGE.TURN_END, {});
}

socket.on('disconnect', function() {
	Store.state.gameConnection = CONNECTION_STATE.DISCONNECT;
	let existingGameState = Store.state.gameState;
	if(existingGameState) {
		switch(existingGameState.phase) {
			case GAME_PHASE.SETUP:
				// if user was in room setup, just forget about the gamestate altogether
				// No need to handle reconnection, user should just join the room normally again
				Store.setGameState(undefined);
				break;
			case GAME_PHASE.PLAY:
			case GAME_PHASE.VOTE:
				let me = existingGameState.findUser(Store.state.username);
				if(me) {
					me.connected = false;
				}
				break;
			default:
				console.warn('Bad gamestate');
				break;
		}
	}
});
socket.on('connect', reconnectToGame);
socket.on('reconnect', reconnectToGame);
function reconnectToGame() {
	let existingGameState = Store.state.gameState;
	let username = Store.state.username;
	if(existingGameState && username && Store.state.gameConnection === CONNECTION_STATE.DISCONNECT) {
		Store.state.gameConnection = CONNECTION_STATE.RECONNECT;
		console.log('Attempting game rejoin.');
		socket.emit(MESSAGE.JOIN_ROOM, {
			roomCode: existingGameState.roomCode,
			username: username,
			rejoin: true,
		});
	}
}
window.faodbg = {
	dcon() {
		socket.disconnect();
	},
	recon() {
		reconnectToGame();
	},
	con() {
		socket.connect();
	}
};

module.exports = Store;
