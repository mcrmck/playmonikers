const MESSAGE = require('../common/message');
const Ajv = require('ajv');
const ajv = new Ajv();
const GameError = require('./game-error');

const usernameMinLength = 1, usernameMaxLength = 20;

const SCHEMA = {};

SCHEMA[MESSAGE.CREATE_ROOM] = {
	$id: MESSAGE.CREATE_ROOM,
	type: 'object',
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
	type: 'object',
	properties: {
		username: {
			type: 'string',
			minLength: usernameMinLength,
			maxLength: usernameMaxLength,
		},
		roomCode: {
			anyOf: [
				{
					type: 'string',
					minLength: 1,
				},
				{
					type: 'number',
				}
			],
		},
		rejoin: {
			type: 'boolean'
		}
	},
	required: ['username', 'roomCode'],
};
SCHEMA[MESSAGE.LEAVE_ROOM] = {
	$id: MESSAGE.LEAVE_ROOM,
	type: 'object',
	properties: {
	},
	required: [],
};
SCHEMA[MESSAGE.JOIN_TEAM] = {
	$id: MESSAGE.JOIN_TEAM,
	type: 'object',
	properties: {
		team: {
			type: 'string',
			enum: ['red', 'blue']
		}
	},
	required: ['team'],
};
SCHEMA[MESSAGE.START_GAME] = {
	$id: MESSAGE.START_GAME,
	type: 'object',
	properties: {
	},
	required: [],
};
SCHEMA[MESSAGE.SUBMIT_STROKE] = {
	$id: MESSAGE.SUBMIT_STROKE,
	type: 'object',
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
	type: 'object',
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
	type: 'object',
	properties: {
	},
	required: [],
};
SCHEMA[MESSAGE.NEXT_CARD] = {
	$id: MESSAGE.NEXT_CARD,
	type: 'object',
	properties: {
		correct: {
			type: 'boolean'
		}
	},
	required: ['correct']
};
SCHEMA[MESSAGE.TURN_END] = {
	$id: MESSAGE.TURN_END,
	type: 'object',
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
