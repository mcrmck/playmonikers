<template>
	<div id="in-game" class="view">
		<div id="select-card-menu" class="view-container" v-if="thisUser.cardsChosen === false">
			<div class="stripe flex-center">
				<div id="game-info" class="stripe-content align-center">
					<p>Choose five cards you like the look of</p>
					<p>(don't tell anyone)</p>
				</div>
			</div>
			<div class="stripe flex-center" id="ten-cards">
				<card
					v-for="card in playerCards"
					class="card-small"
					:class="{highlight: selected.some(c => c.name === card.name)}"
					@select="select(card)"
					v-bind:key="card.name"
					v-bind:name="card.name"
					v-bind:description="card.description"
					v-bind:category="card.category"
					v-bind:points="card.points"
				/>
			</div>
			<div class="stripe flex-center">
				<div class="form-actions">
					<button type="submit" id="submit-cards-btn" class="btn primary" :disabled="selected.length < 5" @click="submit">Submit</button>
				</div>
			</div>
		</div>
		<div id="waiting-menu" v-if="thisUser.cardsChosen === true && !allUsersSubmitted">
			<div class="stripe flex-center">
				<div class="stripe-content align-center">
					<p>Waiting for other players to select their cards</p>
					<p>(feel free to give them a nudge)</p>
					<ul class="users" style="font-weight: bold">
						<li v-for="ncUser in notChosenUsers" :key="'0' + ncUser">{{ncUser}}</li>
					</ul>
				</div>
			</div>
		</div>
		<div class="stripe flex-center" id="game-screen" v-if="allUsersSubmitted">
			<div class="stripe-content" id="red-team">
				<p>RED TEAM</p>
				<ul>
					<li v-for="red in redTeam" :key="'0' + red">
						<span class="crown" :style="{visibility: red.captain ? 'visible' : 'hidden'}">👑</span>{{red.name}}
					</li>
				</ul>
				<div id="team-scores">
					<p>SCORE</p>
					<p id="score-value">{{this.gameState.redCards.reduce((sum, cur) => sum + cur.points, 0)}}</p>
				</div>
			</div>
			<div class="stripe stripe-content">
				<div id="round-info">
					<h1 id="round-title">ROUND {{this.gameState.round}}</h1>
					<h2 id="round-desc" v-if="this.gameState.round === 1">Anything goes!</h2>
					<h2 id="round-desc"  v-if="this.gameState.round === 2">Only one word!</h2>
					<h2 id="round-desc"  v-if="this.gameState.round === 3">No words allowed!</h2>
				</div>
				<div id="countdown-timer" v-if="this.gameState.turnInProgress" :style="{visibility: this.countdown >= 0 ? 'visible' : 'hidden'}">{{countdown}}</div>
				<button v-if="thisUser.captain && !this.gameState.turnInProgress" type="submit" id="ready-btn" class="btn primary" @click="ready()">Ready?</button>
				<button v-if="!thisUser.captain && !this.gameState.turnInProgress" type="submit" id="ready-invis" class="btn primary">Ready?</button>
				<card
					v-if="thisUser.captain && this.gameState.turnInProgress"
					class="stripe-content card"
					v-bind:key="this.gameState.selectedCards[this.gameState.cardIdx].name"
					v-bind:name="this.gameState.selectedCards[this.gameState.cardIdx].name"
					v-bind:description="this.gameState.selectedCards[this.gameState.cardIdx].description"
					v-bind:category="this.gameState.selectedCards[this.gameState.cardIdx].category"
					v-bind:points="this.gameState.selectedCards[this.gameState.cardIdx].points"
				/>
				<card
					v-if="!thisUser.captain || (thisUser.captain && !this.gameState.turnInProgress)"
					class="stripe-content card"
					:class="{'blank-card': !thisUser.captain || (thisUser.captain && !this.gameState.turnInProgress)}"
					key="_"
					name="MONIKERS"
					description="_"
					category="_"
					points="_"
				/>
				<div class="stripe stripe-content">
					<button v-if="thisUser.captain && this.gameState.turnInProgress" type="submit" id="next-card-btn" class="btn primary" @click="nextCard(true)">Correct!</button>
					<button v-if="thisUser.captain && this.gameState.turnInProgress" type="submit" id="next-card-btn" class="btn secondary" @click="nextCard(false)">Skip Card</button>
				</div>
				<div class="stripe stripe-content" id="next-btns-invis">
					<button v-if="!thisUser.captain || !this.gameState.turnInProgress" type="submit" id="next-card-btn" class="btn primary">Correct!</button>
					<button v-if="!thisUser.captain || !this.gameState.turnInProgress" type="submit" id="next-card-btn" class="btn secondary">Skip Card</button>
				</div>
				<div v-if="this.gameState.round > 0" class="stripe stripe-content">
					<p id="cards-remaining-title">CARDS REMAINING</p>
					<p id="cards-remaining-value">{{this.gameState.selectedCards.filter(c => c.collected === false).length}}</p>
				</div>
			</div>
			<div class="stripe-content" id="blue-team">
				<p>BLUE TEAM</p>
				<ul>
					<li v-for="blue in blueTeam" :key="'0' + blue">
						{{blue.name}}<span class="crown" :style="{visibility: blue.captain ? 'visible' : 'hidden'}">👑</span>
					</li>
				</ul>
				<div class="stripe-content" id="team-scores">
					<p>SCORE</p>
					<p id="score-value">{{this.gameState.blueCards.reduce((sum, cur) => sum + cur.points, 0)}}</p>
				</div>
			</div>
		</div>
	</div>
</template>
<script>
const MESSAGE = require('../../common/message');
const Store = require('./state');
const VIEW = require('./view');
const GAME_PHASE = require('../../common/game-phase');
const CONNECTION_STATE = require('./connection-state');
import Card from './card';
import ConnectionOverlay from './connection-overlay';
const timerLimit = 5;

export default {
	name: 'GameView',
	components: {
		ConnectionOverlay,
		Card
	},
	props: {
		gameConnection: {
			type: String,
			required: true,
		},
		gameState: {
			type: Object,
			required: true,
		},
	},
	data() {
		return {
			selected: [],
			countdown: timerLimit
		}
	},
	computed: {
		actionsEnabled() {
			return (
				this.gameConnection === CONNECTION_STATE.CONNECT
			);
		},
		playerCards() {
			let idx = this.gameState.users.findIndex(user => user.name === Store.state.username);
			return this.gameState.cards.slice(idx * 10, idx * 10 + 10);
		},
		thisUser() {
			return this.gameState.users.find(user => user.name === Store.state.username);
		},
		notChosenUsers() {
			return this.gameState.users
				.filter(user => user.cardsChosen === false)
				.map(user => user.name);
		},
		allUsersSubmitted() {
			return this.gameState.users.every(user => user.cardsChosen === true);
		},
		blueTeam() {
			return this.gameState.users.filter(u => u.team === 'blue');
		},
		redTeam() {
			return this.gameState.users.filter(u => u.team === 'red');
		}
	},
	methods: {
		select(card) {
			if (this.selected.some(c => c.name === card.name)) {
				this.selected = this.selected.filter(c => c.name !== card.name);
			} else {
				if (this.selected.length < 5) {
					this.selected.push(card);
				}
			}
		},
		submit() {
			Store.submitCards(this.selected);
		},
		ready() {
			console.log(this.gameState.selectedCards);
			Store.submitTurnStart();
		},
		countdownTimer() {
			if (this.countdown >= 0) {
				setTimeout(() => {
					this.countdown -= 1;
					this.countdownTimer();
				}, 1000);
			} else {
				if (this.thisUser.captain) {
					Store.submitTurnEnd();
				}
				this.countdown = timerLimit;
			}
		},
		nextCard(correct) {
			Store.submitNextCard(correct);
		}
	},
	mounted() {
		Store.getSocket().on(MESSAGE.TURN_START, () => {
			this.countdownTimer();
		});

	},
	updated() {
		this.thisUser = this.gameState.users.find(user => user.name === Store.state.username);
	}
};
</script>
