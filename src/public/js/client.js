const ClientGame = require('../../common/cli-game');
const GAME_PHASE = require('../../common/game-phase');
const MESSAGE = require('../../common/message');
const Util = require('../../common/util');
const VIEW = require('./view');
const Store = require('./state');

import Vue from 'vue';

import HomeMenu from './home-menu.vue';
import SetupView from './setup-view.vue';
import GameView from './game-view.vue';
import RulesView from './rules-view.vue';
import GameMenu from './game-menu.vue';

const app = new Vue({
	el: '#wrapper',
	components: {
		HomeMenu,
		SetupView,
		GameView,
		GameMenu,
		RulesView,
	},
	data: {
		state: Store.state,
	},
	computed: {
		roomCode() {
			return this.state.gameState && this.state.gameState.roomCode;
		},
		usernames() {
			return this.state.gameState && this.state.gameState.getNoTeam();
		},
		reds() {
			return this.state.gameState && this.state.gameState.getReds();
		},
		blues() {
			return this.state.gameState && this.state.gameState.getBlues();
		},
		selectedCards() {
			return this.state.gameState && this.state.gameState.getSelctedCards();
		}
	},
});