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

async function getTorrents() {
	let torrents = await getAllTorrents();
	return getSimplifiedTorrentInfo(torrents.torrents);
}

async function pauseAll() {
	console.log("Pausing all torrents...")
	await getTorrents().map(async torrent => {
		await pauseOne(torrent)
	});
	return;
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
	await getTorrents().map(async torrent => {
		if (!torrent.isFinished) {
			await resumeOne(torrent)
		}
	});
	return;
}

function resumeOne(torrent) {
	return new Promise(async(resolve) => {
		client.start(torrent.id, function(err, result) {
			if (err) console.log(err);
			resolve();
		})
	})
}

async function deleteMany(list) {
	list.map(async torrent => {
		console.log(`Deleting torrent with ID ${list[i].id} for having no peers...`);
		await deleteOne(torrent);
	})
	return;
}

function deleteOne(torrent) {
	return new Promise(async (resolve) => {
		client.remove(torrent.id, true, function(err, result) {
			if (err) console.log(err);
			resolve()
		})
	})
}

async function pauseAllSeeding() {
	console.log("Pausing all seeding...")
	await getTorrents().map(async torrent => {
		if (torrent.isFinished) {
			await pauseOne(torrent)
		}
	});
	return;
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
	let simple = torrents.map(torrent => {
		return {magnet: torrent.magnetLink, id: torrent.id}
	})
	return simple;
}

async function sortQueue(order) {

	let done = Promise.all(order.map((torrent, pos) => {
		console.log(`Setting torrent ID ${torrent.id} to queue position ${pos}`)
		return setTorrentPosition(torrent.id, pos)
	})).filter(a => typeof a !== "undefined");

	if (done.length === 0) {
		console.log("No errors sorting queue")
	} else {
		console.log("Got some errors sorting queue")
		console.log(done)
	}
}