
function randomInt(max) { // max-exclusive
	return Math.floor(Math.random() * max);
}

function AdjustingInterval(workFunc, interval, errorFunc) {
    var that = this;
    var expected, timeout;
    this.interval = interval;

    this.start = function() {
        expected = Date.now() + this.interval;
        timeout = setTimeout(step, this.interval);
    }

    this.stop = function() {
				console.log("ticker stopped")
        clearTimeout(timeout);
    }

    function step() {
        var drift = Date.now() - expected;
        if (drift > that.interval) {
            // You could have some default stuff here too...
            if (errorFunc) errorFunc();
        }
        workFunc();
        expected += that.interval;
        timeout = setTimeout(step, Math.max(0, that.interval-drift));
    }
}

function randomItemFrom(arr) {
	let idx = randomInt(arr.length);
	return arr[idx];
}

// thanks stackOverflow
function shuffle(array) {
  let i = array.length;
  while (i--) {
    const ri = Math.floor(Math.random() * (i + 1));
    [array[i], array[ri]] = [array[ri], array[i]];
  }
  return array;
}

function randomArray(length) {
    var arr = Array.from(Array(length).keys())
		arr = arr.sort(() => Math.random() - 0.5);
		return arr
}



// Sorts users in alternating team order: https://stackoverflow.com/a/55077593
function sortByTeam(users) {
	var alternateSort = (a, b) => a.length ? [a[0], ...alternateSort(b, a.slice(1))] : b;
	let reds = users.filter(u => u.team === 'red');
	let blues = users.filter(u => u.team === 'blue');
	return alternateSort(reds, blues);
}

function validateUsername(name) {
	name = name.trim();
	const minChars = 1;
	const maxChars = 20;
	let regex = new RegExp(`^[0-9a-zA-Z ]{${minChars},${maxChars}}$`);
	return name.match(regex);
}

function capitalize(str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

function negligible(a, b, thresh = 0.0001) {
	return Math.abs(a - b) < thresh;
}

module.exports = {
	randomInt,
	AdjustingInterval,
	randomItemFrom,
	shuffle,
	sortByTeam,
	validateUsername,
	capitalize,
	negligible
};
