<template>
	<div id="rules" class="view">
		<div class="view-container">
			<div class="stripe flex-center">
				<div id="rules-content" class="stripe-content normal-text">
					<div class="align-justify">
						<h1 id="rules-heading">RULES</h1>
						<h2 id="rules-heading">GETTING STARTED</h2>
						<p>Monikers only takes about <strong>5-10 minutes to learn</strong>.</p>
						<p>Start by dividing your group into <strong>2 teams</strong> and joining a <strong>video chat</strong>. It is may be best to use two separate devices if possible.</p>
						<p>Everyone secretly chooses 5 cards they like from the 10 provided to them. All the cards people chose will be shuffled into one deck, which will be used by both teams for the entire game.</p>
						<h2 id="rules-heading">HOW TO PLAY</h2>
						<p>A person from the starting team has <strong>60 seconds</strong> to get their team to guess as many names as possible from the deck by giving clues about the person's identity. There's no limit to the number of guesses.</p>
						<p><strong>Skipping is allowed</strong> and highly encouraged in all rounds. </p>
						<p>Teams get points for the cards they guessed correctly. The skipped cards are reshuffled into the deck after each turn. <strong>Teams take turns giving clues</strong>. Each player will take a turn giving clues before any teammates repeat. </p>
						<h2 id="rules-heading">RULES FOR EACH ROUND</h2>
						<p>Monikers has <strong>3 rounds</strong>. Each has a restriction on how players are allowed to give clues: </p>
						<h3>ROUND 1</h3>
						<p>You can use <strong>any words, sounds, or gestures except the name itself</strong>, including the clue text on the card. If you say any part of the name, you have to skip that card this turn.</p>
						<h3>ROUND 2</h3>
						<p>Use <strong>only one word</strong>, which can be anything except the name itself. You can repeat that word as many times as you like, but no sounds or gestures.</p>
						<h3>ROUND 3</h3>
						<p><strong>Just charades</strong>. No words. Sound effects are OK.</p>
						<h2 id="rules-heading">ENDING THE GAME</h2>
						<p>The team with the highest total score after 3 rounds wins. <strong>But feel free not to keep score</strong> at all. It's fun to play competitively, but not necessary with the right group.</p>
						<p>That's it, really. If you have any unanswered questions, just go with whatever works best for your group. Having fun is more important than getting it perfect.</p>
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
					<p>If you want to know more, you can <a href="https://buffalogames.com/product_images/uploaded_images/instructions/174-Monikers-Instructions_081816.pdf" target="_blank">read the full rules</a> or <a href="https://www.youtube.com/watch?v=bRvEzutZ-ok" target="_blank">watch Polygon play through the game.</a></p>
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
