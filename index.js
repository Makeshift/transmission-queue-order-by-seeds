const parseTorrent = require('./parseTorrent');
const getTrackerPeerList = require('./getTrackerPeerList');
const getDHTPeerList = require('./getDHTPeerList');
const transmission = require('./transmission');
const config = require('./config');

function getPeerCount(torrent) {
	return new Promise(async (resolve, reject) => {
		let parsedTorrent = await parseTorrent(torrent.magnet);
		let dhtPeers, trackerPeers;
		[dhtPeers = await getDHTPeerList(parsedTorrent), trackerPeers = await getTrackerPeerList(parsedTorrent)]
		console.log("Got total peers for torrent " + (dhtPeers + trackerPeers));
		torrent.totalPeers = dhtPeers + trackerPeers;
		resolve(torrent)
	})
}

async function sortAllTorrents() {
	let torrents = await transmission.getTorrents();
	let peerCounters = [];
	for (let i = 0; i < torrents.length; i++) {
		peerCounters.push(getPeerCount(torrents[i]));
	}
	peerCounters = await Promise.all(peerCounters);
	let byPeerOrder = peerCounters.sort((a, b) => {return a.totalPeers < b.totalPeers})
	console.log(byPeerOrder);
}




sortAllTorrents();
