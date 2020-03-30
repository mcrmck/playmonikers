const Util = require('./util');

class User {
	constructor(socket, name) {
		if(!Util.validateUsername(name)) {
			return undefined;
		}
		this.socket = socket;
		this.name = name;
		this.gameRoom = undefined;
		this.team = undefined;
		this.captain = false;
		this.cardsChosen = false;
	}

	setGameRoom(gameRoom) {
		this.gameRoom = gameRoom;
	}
	setTeam(team) {
		this.team = team;
	}
	setCaptain(captain) {
		this.captan = captain;
	}
	setCardsChosen(cardsChosen) {
		this.cardsChosen = cardsChosen;
	}

	get connected() {
		return Boolean(this.socket && this.socket.connected);
	}
	get logName() {
		return `<${this.name}>`;
	}
}

module.exports = User;