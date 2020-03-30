<template>
	<div id="rules" class="view">
		<div class="view-container">
			<div class="stripe flex-center">
				<div id="rules-content" class="stripe-content normal-text">
					<div class="align-justify">
						<p>Monikers has <strong>3 rounds</strong>. A red team and a blue team have <strong>60 seconds</strong> to describe as many people, characters or things from the deck of cards.</p> 
						<p>Each of the three rounds has a restriction on how clues can be given:</p>
						<p>ROUND 1: <strong>Use any words, sounds or gestures</strong>. You can't use the name on the card during your description, but you can use the clues written beneath the name.</p>
						<p>ROUND 2: <strong>Use only 1 word as a clue</strong>. You aren't allowed to use sounds, gestures or the name itself.</p>
						<p>ROUND 3: <strong>Use only charades</strong>. No words are allowed. Sound effects are allowed (within reason).</p>
						<p>There's no limit to the number of guesses, and <strong>cards can be skipped</strong> if a team can't guess who they are.</p>
						<p><strong>The teams keep the cards they guessed correctly</strong> to score after the round. Skipped cards are reshuffled into the deck.</p>
						<p><strong>The teams take it in turn giving clues</strong>, and each player in each team should take it in turn to give clues too.</p>
						<p><strong>Each of the 3 rounds ends when all the cards from the deck have been guessed correctly</strong>. After that, the teams add the point values from the cards they correctly guessed and <strong>shuffle the cards back together into one deck</strong> for the next round. The team with the lowest score starts the next round.</p>
						<p><strong>The team with the highest total score after 3 rounds wins</strong> (but it's not necessary to keep score at all).</p>
					</div>
				</div>
			</div>
			<div id="rules-cards" class="stripe flex-center">
				<div class="flex-center">
					<card
						v-for="card in json"
						v-bind:key="card.name"
						v-bind:name="card.name"
						v-bind:description="card.description"
						v-bind:category="card.category"
						v-bind:points="card.points"
						id="rules-card"
					/>
				</div>
			</div>
			<div class="stripe flex-center">
				<div class="align-justify">
					<p>If you want to know more, you can <a href="https://buffalogames.com/product_images/uploaded_images/instructions/174-Monikers-Instructions_081816.pdf">read the full rules</a> or <a href="https://www.youtube.com/watch?v=bRvEzutZ-ok">watch Polygon play through the game.</a></p>
				</div>
			</div>
			<div class="stripe flex-center">
				<div class="align-center">
					<button class="btn tertiary" @click="back()">Back</button>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
	const Store = require('./state');
	const VIEW = require('./view');
	import Card from './card';
	import cardsJson from './cards.json';

	const n = 3;
	let cardsSample = _.sampleSize(cardsJson, n);
	
	export default {
		name: 'RulesView',
		created: {
			
		},
		data() {
			return {
				json: cardsSample
			}
		},
		components: {
			Card
		},
		methods: {
			back() {
				Store.setView(Store.state.previousView);
			}
		},
	};
</script>
