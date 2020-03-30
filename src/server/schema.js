const MESSAGE = require('../common/message');
const Ajv = require('ajv');
const ajv = new Ajv();
const GameError = require('./game-error');

const usernameMinLength = 1, usernameMaxLength = 20;

const SCHEMA = {};

SCHEMA[MESSAGE.CREATE_ROOM] = {
	$id: MESSAGE.CREATE_ROOM,
	properties: {
		username: {
			type: 'string',
			minLength: usernameMinLength,
			maxLength: usernameMaxLength,
		},
	},
	required: ['username'],
};
SCHEMA[MESSAGE.JOIN_ROOM] = {
	$id: MESSAGE.JOIN_ROOM,
	properties: {
		username: {
			type: 'string',
			minLength: usernameMinLength,
			maxLength: usernameMaxLength,
		},
		roomCode: {
			type: ['string', 'number'],
			minLength: 1,
		},
		rejoin: {
			type: 'boolean'
		}
	},
	required: ['username', 'roomCode'],
};
SCHEMA[MESSAGE.LEAVE_ROOM] = {
	$id: MESSAGE.LEAVE_ROOM,
	properties: {
	},
	required: [],
};
SCHEMA[MESSAGE.JOIN_TEAM] = {
	$id: MESSAGE.JOIN_TEAM,
	properties: {
		team: {
			type: 'string'
		}
	},
	required: [],
};
SCHEMA[MESSAGE.START_GAME] = {
	$id: MESSAGE.START_GAME,
	properties: {
	},
	required: [],
};
SCHEMA[MESSAGE.SUBMIT_STROKE] = {
	$id: MESSAGE.SUBMIT_STROKE,
	properties: {
		points: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					x: {
						type: 'number',
					},
					y: {
						type: 'number',
					},
				},
				required: ['x', 'y'],
			},
			minItems: 2,
		},
	},
	required: ['points'],
};
SCHEMA[MESSAGE.SUBMIT_CARDS] = {
	$id: MESSAGE.SUBMIT_CARDS,
	properties: {
		cards: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					name: {
						type: 'string'
					},
					description: {
						type: 'string'
					},
					category: {
						type: 'string'
					},
					points: {
						type: 'integer'
					}
				},
				required: ['category', 'description', 'name', 'points']
			},
			minItems: 5
		}
	},
	required: ['cards']
};
SCHEMA[MESSAGE.TURN_START] = {
	$id: MESSAGE.TURN_START,
	properties: {
	},
	required: [],
};
SCHEMA[MESSAGE.NEXT_CARD] = {
	$id: MESSAGE.NEXT_CARD,
	properties: {
		correct: {
			type: 'boolean'
		}
	},
	required: ['correct']
};
SCHEMA[MESSAGE.TURN_END] = {
	$id: MESSAGE.TURN_END,
	properties: {
	},
	required: [],
};

for(let schema of Object.values(SCHEMA)) {
	ajv.addSchema(schema, schema.$id);
}
console.log(`Message schemas loaded.`);

function validateMessageFromClient(messageName, json) {
	if(!SCHEMA[messageName]) {
		return true;
	}

	let res = ajv.validate(messageName, json);
	if(!res) {
		console.warn(ajv.errorsText());
		throw new GameError('Invalid message');
	}
	return res;
}

module.exports = {
	validateMessageFromClient
};