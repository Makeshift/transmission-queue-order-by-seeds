const transmission = require('transmission');
const config = require('./config').transmission;
let client = new transmission(config);

module.exports = {
	getTorrents: getTorrents,
	sortQueue: sortQueue
}

function getTorrents() {
	return new Promise(async (resolve) => {
		let torrents = await getAllTorrents();
		console.log(torrents)
		console.log(typeof torrents);
		resolve(getSimplifiedTorrentInfo(torrents.torrents));
	})
}

function getAllTorrents() {
	return new Promise((resolve) => {
		client.get(function(err, res) {
			resolve(res);
		})
	})
}

function setTorrentPosition(id, pos) {
	return new Promise((resolve) => {
		client.set(id, {queuePosition: pos}, function(err) {
			if (err) console.log(err);
			resolve();
		})
	})
}

function getSimplifiedTorrentInfo(torrents) {
	console.log(torrents);
	let simple = [];
	for (let i = 0; i < torrents.length; i++) {
		simple.push({
			magnet: torrents[i].magnetLink,
			id: torrents[i].id
		})
	}
	return simple;
}

async function sortQueue(order) {
	let promises = [];
	for (let i = 0; i < order.length; i++) {
		promises.push(setTorrentPosition(order[i].id, i))
	}
	promises = await Promise.all(promises);
	//Clean up promises so we only emit errors
	promises = promises.filter(a => typeof a !== "undefined")
	if (promises.length === 0) {
		console.log("No errors sorting queue")
	} else {
		console.log("Got some errors sorting queue")
		console.log(promises)
	}
}