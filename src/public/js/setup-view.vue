<template>
<div id="room-setup" class="view">
	<div class="view-container">
		<confirmation id="confirm-leave" v-if="leaveConfirmationDialogVisible" @close="leaveConfirmationDialogVisible = false" @confirm="leave">
			<h3>Leave Game</h3>
			<div>
				Are you sure you want to leave?
			</div>
		</confirmation>

		<div class="stripe flex-center align-center game-code">
			<div class="stripe-content">
				<div id="setup-header" class="game-code">Game code</div>
				<h1>{{roomCode}}</h1>
			</div>
		</div>

		<div class="stripe flex-center align-center users">
			<div class="stripe-content users">
				<div id="setup-header">Unassigned players:</div>
				<ul class="users">
					<li v-for="username in usernames" :key="'0' + username">{{username}}</li>
				</ul>
			</div>
		</div>
		<div class="stripe flex-center align-center users">
			<div id="red-team" class="stripe-content">
				<div id="setup-header">Red team:</div>
				<ul class="users reds">
					<li v-for="red in reds" :key="'0' + red">{{red}}</li>
				</ul>
			</div>
			<div id="blue-team" class="stripe-content">
				<div id="setup-header">Blue team:</div>
				<ul class="users blues">
					<li v-for="blue in blues" :key="'0' + blue">{{blue}}</li>
				</ul>
			</div>
		</div>
		<div class="stripe flex-center align-center">
			<button id="join-red" class="btn primary" @click="joinTeam('red')">Join Red</button>
			<button id="join-blue" class="btn primary" @click="joinTeam('blue')">Join Blue</button>
		</div>
		<div class="stripe flex-center align-center actions">
			<div class="stripe-content">
				<div class="warning" v-if="startWarning !== undefined">
            		<p>{{startWarning}}</p>
        		</div>
				<div class="tinytext tip" style="margin-bottom: 10px;">
					Players won't be able to join a game in progress
				</div>
				<button class="btn primary big" @click="start">Start Game</button>
				<div style="clear: both"/>
				<button class="btn tertiary" @click="leaveConfirmationDialogVisible = true">Leave</button>
			</div>
		</div>
	</div>
</div>
</template>

<script>
const Store = require('./state');
const VIEW = require('./view');
import Confirmation from './confirmation';
export default {
	name: 'SetupView',
	components: {
		Confirmation,
	},
	props: {
		startWarning: {
			type: String,
		},
		roomCode: {
			type: String,
		},
		usernames: {
			type: Array,
		},
		reds: {
			type: Array,
		},
		blues: {
			type: Array,
		}
	},
	data() {
		return {
			leaveConfirmationDialogVisible: false
		};
	},
	watch: {
	},
	methods: {
		start() {
			Store.submitStartGame(this.reds, this.blues, this.usernames);
		},
		leave() {
			Store.setView(VIEW.HOME);
			Store.submitLeaveGame();
		},
		joinTeam(team) {
			Store.submitJoinTeam(team);
		}
	}
};
</script>
