const transmission = require('transmission');
const config = require('./config').transmission;
let client = new transmission(config);

module.exports = {
	getTorrents: getTorrents,
	sortQueue: sortQueue,
	deleteMany: deleteMany,
	pauseAll: pauseAll,
	resumeAll: resumeAll,
	pauseAllSeeding: pauseAllSeeding
}

function getTorrents() {
	return new Promise(async (resolve) => {
		let torrents = await getAllTorrents();
		resolve(getSimplifiedTorrentInfo(torrents.torrents));
	})
}

async function pauseAll() {
	console.log("Pausing all torrents...")
	return new Promise(async(resolve) => {
		let torrents = await getTorrents();
		for (let i = 0; i < torrents.length; i++) {
			await pauseOne(torrents[i])
		}
		resolve();
	})
}

function pauseOne(torrent) {
	return new Promise(async(resolve) => {
		client.stop(torrent.id, function(err, result) {
			if (err) console.log(err);
			resolve();
		})
	})
}

async function resumeAll() {
	console.log("Resuming all torrents...")
	return new Promise(async(resolve) => {
		let torrents = await getTorrents();
		for (let i = 0; i < torrents.length; i++) {
			await resumeOne(torrents[i])
		}
		resolve();
	})
}

function resumeOne(torrent) {
	return new Promise(async(resolve) => {
		client.start(torrent.id, function(err, result) {
			if (err) console.log(err);
			resolve();
		})
	})
}

function deleteMany(list) {
	return new Promise(async (resolve) => {
		for (let i = 0; i < list.length; i++) {
			console.log(`Deleting torrent with ID ${list[i].id} for having no peers...`)
			await deleteOne(list[i]);
		}
		resolve();
	})

}

function deleteOne(torrent) {
	return new Promise(async (resolve) => {
		client.remove(torrent.id, true, function(err, result) {
			if (err) console.log(err);
			resolve()
		})
	})
}

function pauseAllSeeding() {
	console.log("Pausing all seeding...")
	return new Promise(async(resolve) => {
		let torrents = await getTorrents();
		for (let i = 0; i < torrents.length; i++) {
			if (torrents[i].isFinished) {
				await pauseOne(torrents[i])
			}
		}
		resolve();
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
		console.log(`Setting torrent ID ${order[i].id} to queue position ${i}`)
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