const parseTorrent = require('./parseTorrent');
const getTrackerPeerList = require('./getTrackerPeerList');
const getDHTPeerList = require('./getDHTPeerList');
const transmission = require('./transmission');
const config = require('./config');

async function getPeerCount(torrent) {
	let parsedTorrent = await parseTorrent(torrent.magnet);
	let dhtPeers, trackerPeers;
	[dhtPeers = await getDHTPeerList(parsedTorrent), trackerPeers = await getTrackerPeerList(parsedTorrent)]
	console.log(`Got total peers for torrent ${torrent.id}: ${(dhtPeers + trackerPeers)}`);
	torrent.totalPeers = dhtPeers + trackerPeers;
	return torrent
}

async function sortAllTorrents() {
	let torrents = await transmission.getTorrents();
	console.log(`Got all ${torrents.length} torrents, grabbing peer counts`)
	let peerCounters = [];
	for (let i = 0; i < torrents.length; i += config.concurrency) {
		if (i >= torrents.length) break;
		let concurrent = [];
		for (let x = i; x < i + config.concurrency; x++) {
			if (x >= torrents.length) break;
			concurrent.push(getPeerCount(torrents[x]))
		}
		peerCounters.push(await Promise.all(concurrent));
		console.log(`Set complete ${i} - ${i+config.concurrency}`)
	}
	//peerCounters = await Promise.all(peerCounters);
	console.log("Got all peer counts, sorting")
	//Merge all arrays and sort
	let byPeerOrder = await sortByPeerAmount([].concat.apply([], peerCounters));
	console.log(byPeerOrder);
	await transmission.sortQueue(byPeerOrder);
	if (config.removeNoPeers) {
		let noPeers = [];
		for (let i = 0; i < byPeerOrder.length; i++) {
			if (byPeerOrder[i].totalPeers === 0) {
				noPeers.push(byPeerOrder[i])
			}
		}
		await transmission.deleteMany(noPeers);
	}
	await transmission.pauseAll();
	await transmission.resumeAll();
	if (config.pauseAllSeeding) {
		await transmission.pauseAllSeeding();
	}
	console.log("All done.")
}


async function sortByPeerAmount(arr) {
	return arr.sort((a, b) => {
		return b.totalPeers - a.totalPeers;
	});
}

async function test() {
	await transmission.pauseAll();
	await transmission.resumeAll();
	if (config.pauseAllSeeding) {
		await transmission.pauseAllSeeding();
	}
}


//test();
sortAllTorrents();