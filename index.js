const parseTorrent = require('./parseTorrent');
const getTrackerPeerList = require('./getTrackerPeerList');
const getDHTPeerList = require('./getDHTPeerList');
const getPeXPeerList = require('./getPeXPeerList');
const transmission = require('./transmission');

async function getPeers(torrent) {
	let parsedTorrent = await parseTorrent(torrent);
	console.log(parsedTorrent);
	let dhtPeers = await getDHTPeerList(parsedTorrent);
	//let peers = await getTrackerPeerList(parsedTorrent);
	console.log(dhtPeers);
}

getPeers(process.argv[2])