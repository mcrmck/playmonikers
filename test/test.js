// const assert = require('assert');
const chai = require('chai');
const assert = chai.assert;
const { io } = require('socket.io-client');
const MESSAGE = require('../src/common/message');
const A = require('async');
const GAME_PHASE = require('../src/common/game-phase');
const GameRoom = require('../src/server/game-room').GameRoom;
const User = require('../src/common/user');

describe('Test Suite', function() {
	let sock1, sock2, sock3;

	beforeEach(function(done) {
		require('../src/server/main')
			.then(function() {
				sock1 = io('http://localhost:3000');
				sock2 = io('http://localhost:3000');
				sock3 = io('http://localhost:3000');

				function connectSocketFn(s) {
					return (cb) => {
						s.on('connect', function() {
							// console.log('connected');
							cb();
						});
						s.on('disconnect', function() {
							// console.log('disconnected');
						});
					};
				}

				A.parallel(
					[connectSocketFn(sock1), connectSocketFn(sock2), connectSocketFn(sock3)],
					() => { done(); }
				);
			})
			.catch(function(e) {
				console.error(e);
			});
	});

	afterEach(function(done) {
		[sock1, sock2, sock3].forEach(function(s) {
			if(s && s.connected) {
				debugger;
				s.disconnect();
				console.log('force disconnect');
			}
		});
		done();
	});

	describe('CREATE_ROOM', function() {
		it('accept valid login', function(done) {
			sock1.emit(MESSAGE.CREATE_ROOM, {
				username: 'playerA',
			});
			sock1.once(MESSAGE.CREATE_ROOM, function(data) {
				assert.notExists(data.err);
				done();
			});
		});
		it('reject missing username', function(done) {
			sock1.emit(MESSAGE.CREATE_ROOM, {});
			sock1.once(MESSAGE.CREATE_ROOM, function(data) {
				assert.exists(data.err);
				done();
			});
		});
		it('reject empty username', function(done) {
			sock1.emit(MESSAGE.CREATE_ROOM, {
				username: '',
			});
			sock1.once(MESSAGE.CREATE_ROOM, function(data) {
				assert.exists(data.err);
				done();
			});
		});
		it('reject long username', function(done) {
			sock1.emit(MESSAGE.CREATE_ROOM, {
				username: '123456789012345678901234567890',
			});
			sock1.once(MESSAGE.CREATE_ROOM, function(data) {
				assert.exists(data.err);
				done();
			});
		});
		it('reject user already in a room', function(done) {
			sock1.emit(MESSAGE.CREATE_ROOM, {
				username: 'playerB',
			});
			sock1.once(MESSAGE.CREATE_ROOM, function(data) {
				assert.notExists(data.err);
				sock1.emit(MESSAGE.CREATE_ROOM, {
					username: 'playerBB',
				});
				sock1.once(MESSAGE.CREATE_ROOM, function(data) {
					assert.exists(data.err);
					done();
				});
			});
		});
	});

	describe('JOIN_ROOM', function() {
		it('accept valid login', function(done) {
			sock1.emit(MESSAGE.CREATE_ROOM, {
				username: 'bob',
			});
			sock1.once(MESSAGE.CREATE_ROOM, function(data) {
				let roomCode = data.roomState.roomCode;
				sock2.emit(MESSAGE.JOIN_ROOM, {
					username: 'larry',
					roomCode,
				});
				sock2.once(MESSAGE.JOIN_ROOM, function(data) {
					assert.notExists(data.err);
					done();
				});
			});
		});
		it('reject missing roomCode', function(done) {
			sock2.emit(MESSAGE.JOIN_ROOM, {
				username: 'nobody',
				roomCode: 1234, // what are the chances?
			});
			sock2.once(MESSAGE.JOIN_ROOM, function(data) {
				assert.exists(data.err);
				done();
			});
		});
		// it('reject join full room', function(done) {

		// });
		it('reject missing roomCode', function(done) {
			sock2.emit(MESSAGE.JOIN_ROOM, {
				username: 'xyz',
			});
			sock2.once(MESSAGE.JOIN_ROOM, function(data) {
				assert.exists(data.err);
				done();
			});
		});
		it('reject missing username', function(done) {
			sock2.emit(MESSAGE.JOIN_ROOM, {
				roomCode: 1234,
			});
			sock2.once(MESSAGE.JOIN_ROOM, function(data) {
				assert.exists(data.err);
				done();
			});
		});
		// not gonna bother with username validation tests right now
		it('reject duplicate username in room', function(done) {
			sock1.emit(MESSAGE.CREATE_ROOM, {
				username: 'spartacus',
			});
			sock1.once(MESSAGE.CREATE_ROOM, function(data) {
				let roomCode = data.roomState.roomCode;
				sock2.emit(MESSAGE.JOIN_ROOM, {
					username: 'spartacus',
					roomCode,
				});
				sock2.once(MESSAGE.JOIN_ROOM, function(data) {
					assert.exists(data.err);
					done();
				});
			});
		});
	});

	describe('JOIN_TEAM', function() {
		it('reject missing team', function(done) {
			sock1.emit(MESSAGE.CREATE_ROOM, {
				username: 'playerC',
			});
			sock1.once(MESSAGE.CREATE_ROOM, function(data) {
				assert.notExists(data.err);
				sock1.emit(MESSAGE.JOIN_TEAM, {});
				sock1.once(MESSAGE.JOIN_TEAM, function(data) {
					assert.exists(data.err);
					done();
				});
			});
		});
		it('reject unauthenticated socket', function(done) {
			sock1.emit(MESSAGE.JOIN_TEAM, {
				team: 'red',
			});
			sock1.once(MESSAGE.JOIN_TEAM, function(data) {
				assert.exists(data.err);
				done();
			});
		});
	});

	describe('RETURN_TO_SETUP', function() {
		it('works mid-game', function(done) {
			sock1.emit(MESSAGE.CREATE_ROOM, {
				username: 'bob',
			});
			sock1.once(MESSAGE.CREATE_ROOM, function(data) {
				let roomCode = data.roomState.roomCode;
				assert.notExists(data.err);
				sock1.emit(MESSAGE.START_GAME);
				sock1.once(MESSAGE.START_GAME, function(data) {
					sock1.emit(MESSAGE.RETURN_TO_SETUP);
					sock1.once(MESSAGE.RETURN_TO_SETUP, function(data) {
						assert.notExists(data.err);
						assert.equal(data.roomState.phase, GAME_PHASE.SETUP);
						done();
					});
				});
			});
		});
		it('works between rounds', function(done) {
			// TODO
			done();
		});
	});

	describe('GameRoom', function() {
		function makeUser(name, team) {
			let user = new User({ connected: true }, name);
			user.setTeam(team);
			return user;
		}

		function makeStartedRoom(roomCode) {
			let room = new GameRoom(roomCode);
			room.addUser(makeUser(`${roomCode}-red`, 'red'), true);
			room.addUser(makeUser(`${roomCode}-blue`, 'blue'));
			room.addCards([
				{ name: `${roomCode}-1`, description: 'a', category: 'x', points: 1 },
				{ name: `${roomCode}-2`, description: 'b', category: 'x', points: 1 },
				{ name: `${roomCode}-3`, description: 'c', category: 'x', points: 1 },
				{ name: `${roomCode}-4`, description: 'd', category: 'x', points: 1 },
				{ name: `${roomCode}-5`, description: 'e', category: 'x', points: 1 },
				{ name: `${roomCode}-6`, description: 'f', category: 'x', points: 1 },
				{ name: `${roomCode}-7`, description: 'g', category: 'x', points: 1 },
				{ name: `${roomCode}-8`, description: 'h', category: 'x', points: 1 },
				{ name: `${roomCode}-9`, description: 'i', category: 'x', points: 1 },
				{ name: `${roomCode}-10`, description: 'j', category: 'x', points: 1 },
			]);
			room.startNewRound();
			room.order = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
			room.cardOrderIdx = 0;
			room.cardIdx = room.order[room.cardOrderIdx];
			return room;
		}

		it('tracks card order independently for each room', function() {
			let roomA = makeStartedRoom('A');
			let roomB = makeStartedRoom('B');

			roomA.nextCard(false);

			assert.equal(roomA.cardIdx, 1);
			assert.equal(roomB.cardIdx, 0);
			assert.equal(roomB.cardOrderIdx, 0);
		});

		it('setCaptain updates the captain flag', function() {
			let user = makeUser('captain', 'red');
			user.setCaptain(true);
			assert.isTrue(user.captain);
		});
	});
});
