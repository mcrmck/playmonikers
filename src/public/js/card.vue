<template>
    <div class="card" @click="$emit('select')">
        <div class="card-title">{{name}}</div>
        <div class="card-desc">{{description}}</div>
        <div class="card-sep">·············</div>
        <div class="card-type" :class="cardTypeClass">{{category}}</div>
        <div class="card-points" :class="cardPointsClass"><p class="point-score">{{points}}</p>POINTS</div>
    </div>
</template>

<script>
export default {
    name: 'Card',
    props: {
        name: String,
        description: String,
        category: String,
        points: Number,
        collected: {
            type: Boolean,
            default: false
        }
    },
    computed: {
        cardTypeClass() {
            if (this.points === 1) {
                return "points-one-t";
            } else if (this.points === 2) {
                return "points-two-t";
            } else if (this.points === 3) {
                return "points-three-t";
            } else if (this.points === 4) {
                return "points-four-t";
            }
        },
        cardPointsClass() {
            if (this.points === 1) {
                return "points-one-p";
            } else if (this.points === 2) {
                return "points-two-p";
            } else if (this.points === 3) {
                return "points-three-p";
            } else if (this.points === 4) {
                return "points-four-p";
            }
        },
    },
    methods: {
    }
}
</script>