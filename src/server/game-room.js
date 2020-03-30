const Stroke = require('../common/stroke');
const GAME_PHASE = require('../common/game-phase');
const Util = require('../common/util');
const _ = require('lodash');
const GameError = require('./game-error');
const cardsJson = require('../public/js/cards.json');

const MAX_USERS = 10;

class GameRoom {
	constructor(roomCode, host) {
		this.roomCode = roomCode;
		this.users = [];
		this.host = host;

		this.round = 0;
		this.phase = GAME_PHASE.SETUP;
		this.turnInProgress = false;

		this.turn = -1;
		this.hint = undefined;
		this.faker = undefined;

		this.cards = [];
		this.selectedCards = [];
		this.cardIdx = 0;
		this.redCards = [];
		this.blueCards = [];
		this.strokes = [];
	}
	addUser(user, isHost = false) {
		if(this.isFull()) {
			console.warn('Full room');
			return false;
		}
		this.users.push(user);
		if(isHost) {
			this.host = user;
		}
		return true;
	}
	readdUser(user) {
		let userTargetIdx = this.users.findIndex((u) => (u.name === user.name));
		if(userTargetIdx !== -1) {
			this.users[userTargetIdx] = user;
		} else {
			throw new GameError(`Could not readd ${user.logName}. Existing user target DNE.`, 'Could not rejoin');
		}
	}
	dropUser(user) {
		let uIdx = this.users.indexOf(user);
		this.users.splice(uIdx, 1);
		return this.users.length;
	}
	findUser(name) {
		return this.users.find((p) => (p.name === name));
	}
	startNewRound() {
		if (this.round === 0) {
			this.cards = _.sampleSize(cardsJson, this.users.length * 10);
			this.cards.forEach(c => c.collected = false);
			this.users = Util.sortByTeam(this.users);
		}
		this.round++;
		this.phase = GAME_PHASE.PLAY;
		this.turn = 1;
		this.faker = Util.randomItemFrom(this.users);
		this.strokes = [];
		this.users[0].captain = true;
		console.log(`New round: Room-${this.roomCode} start round ${this.round}`);
	}
	turnStart() {
		this.turnInProgress = true;
	}
	nextCard(correct) {
		console.log(`Card clicked: ${this.selectedCards[this.cardIdx].name}`);
		console.log(`${this.selectedCards[this.cardIdx].name} collected = ${correct}`);
		console.log(`Card index before rotation: ${this.cardIdx}`);
		let playingTeam = this.users.find(u => u.captain === true).team;
		if (correct) {
			this.selectedCards[this.cardIdx].collected = true;
			if (this.selectedCards.every(c => c.collected === true)) {
				console.log('Round over!');
				return this.cardIdx;
			}
			if (playingTeam === 'red') {
				this.redCards.push(this.selectedCards[this.cardIdx]);
			} else if (playingTeam === 'blue') {
				this.blueCards.push(this.selectedCards[this.cardIdx]);
			}
		}
		this.cardIdx++;
		for (; this.cardIdx < this.selectedCards.length; this.cardIdx++) {
			if (this.cardIdx === this.selectedCards.length - 1) {
				this.cardIdx = 0;
			}
			if(!this.selectedCards[this.cardIdx].collected) {
				console.log(`Card index after rotation: ${this.cardIdx}`);
				return this.cardIdx;
			}
		}
	}
	turnEnd() {
		let captIdx = this.users.findIndex(u => u.captain === true);
		this.users[captIdx].captain = false;
		if (captIdx === this.users.length - 1) {
			this.users[0].captain = true;
		} else {
			this.users[captIdx + 1].captain = true;
		}
		this.turnInProgress = false;
	}
	invokeSetup() {
		console.log(`Force setup: Room-${this.roomCode}`);
		this.phase = GAME_PHASE.SETUP;
		this.turn = -1;
		this.hint = undefined;
		this.faker = undefined;
		this.users = this.users.filter(u => u.connected);
	}
	whoseTurn() {
		if(this.phase === GAME_PHASE.PLAY) {
			let idx = ((this.turn - 1) % this.users.length);
			return this.users[idx];
		}
		return undefined;
	}
	addStroke(username, points) {
		this.strokes.push(new Stroke(username, points));
		return this.strokes;
	}
	addCards(cards) {
		this.selectedCards.push.apply(this.selectedCards, cards);
	}
	nextTurn() {
		if(this.gameInProgress()) {
			this.turn++;
			if(this.turn - 1 >= this.users.length * 2) {
				this.phase = GAME_PHASE.VOTE;
			}
			return this.turn;
		}
		return undefined;
	}
	gameInProgress() {
		return this.phase === GAME_PHASE.PLAY || this.phase === GAME_PHASE.VOTE;
	}
	isFull() {
		return this.users.length >= MAX_USERS;
	}
	hasUnassignedPlayers() {
		return this.users.some(user => user.team === undefined);
	}
	isDead() {
		return this.users.length === 0 || _.every(this.users, u => (!u.connected));
	}
}

const ClientAdapter = {
	generateStateJson(gameRoom, pickFields) {
		let res = {
			roomCode: gameRoom.roomCode,
			users: _.map(gameRoom.users, (u) => ({
				name: u.name,
				connected: u.connected,
				team: u.team,
				cardsChosen: u.cardsChosen,
				captain: u.captain
			})),
			cards: gameRoom.cards,
			selectedCards: gameRoom.selectedCards,
			redCards: gameRoom.redCards,
			blueCards: gameRoom.blueCards,
			cardIdx: gameRoom.cardIdx,
			round: gameRoom.round,
			phase: gameRoom.phase,
			turnInProgress: gameRoom.turnInProgress,
			turn: gameRoom.turn,
			whoseTurn: gameRoom.whoseTurn() ? gameRoom.whoseTurn().name : null, // null, so the empty value still gets passed to the client
			hint: gameRoom.hint,
			fakerName: gameRoom.faker ? gameRoom.faker.name : undefined,
			strokes: gameRoom.strokes,
		};
		if(pickFields) {
			res = _.pick(res, pickFields);
		}
		return res;
	},
	hideFaker(stateJson) {
		let res = _.cloneDeep(stateJson);
		res.fakerName = undefined;
		return res;
	},
};

module.exports = {
	GameRoom, ClientAdapter,
};