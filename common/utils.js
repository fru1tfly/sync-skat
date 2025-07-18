const bids = [
    18, 20, 22, 23, 24,
    27, 30, 33, 35, 36,
    40, 44, 45, 46, 48, 
    50, 54, 55, 59, 60,
    63, 66, 70, 72, 77,
    80, 81, 84, 88, 90,
    96, 99, 100, 108, 110, 
    117, 120, 121, 126, 130, 
    132, 135, 140, 143, 144,
    150, 153, 154, 156, 160, 
    162, 165, 168, 170, 176,
    180, 187, 192, 198, 204,
    216, 240, 264
];

function shuffle(array) {
	let currentIndex = array.length;
	while (currentIndex !== 0) {
		let randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;
		[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
	}
    return array;
}

module.exports['bids'] = bids;
module.exports['shuffle'] = shuffle;