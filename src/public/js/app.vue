<template>
	<div id="wrapper" class="light-theme">
		<div id="home" class="view" v-if="state.view === 'home'">
			<div class="view-container">
				<div class="stripe align-center">
					<div class="stripe-content">
						<h1 id="title-banner">PLAY MONIKERS</h1>
						<h2>AN UNOFFICIAL REMOTE PLAY ADAPTATION</h2>
					</div>
				</div>
				<div class="stripe flex-center">
					<home-menu :initial-username="state.username" :create-warning="state.createWarning" :join-warning="state.joinWarning"></home-menu>
				</div>
				<div class="stripe">
					<div id="about-content" class="stripe-content normal-text align-center">
						<p>Based on the party game <a href="http://www.monikersgame.com/" target="_blank">Monikers</a>.</p>
						<p>Available for free under a <a href="http://www.creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank">Creative Commons BY-NC-SA 4.0 liscence</a>.</p>
						<p>Please use a modern browser!</p>
					</div>
				</div>
			</div>
		</div>
		<rules-view v-if="state.view === 'rules'"></rules-view>
		<setup-view v-if="state.view === 'setup'" :start-warning="state.startWarning" :room-code="state.gameState === undefined ? undefined : state.gameState.roomCode" :usernames="usernames" :reds="reds" :blues="blues"></setup-view>
		<game-view v-if="state.view === 'game'" :game-state="state.gameState" :game-connection="state.gameConnection"></game-view>
	</div>
</template>

<script>
const Store = require('./state');

import HomeMenu from './home-menu.vue';
import SetupView from './setup-view.vue';
import GameView from './game-view.vue';
import RulesView from './rules-view.vue';

export default {
	name: 'App',
	components: {
		HomeMenu,
		SetupView,
		GameView,
		RulesView,
	},
	data() {
		return {
			state: Store.state,
		};
	},
	computed: {
		usernames() {
			return this.state.gameState && this.state.gameState.getNoTeam();
		},
		reds() {
			return this.state.gameState && this.state.gameState.getReds();
		},
		blues() {
			return this.state.gameState && this.state.gameState.getBlues();
		},
	}
};
</script>
