const parseTorrent = require('./parseTorrent');
const getTrackerPeerList = require('./getTrackerPeerList');
const getDHTPeerList = require('./getDHTPeerList');
const transmission = require('./transmission');

async function getPeers(torrent) {
	let parsedTorrent = await parseTorrent(torrent);
	console.log(parsedTorrent);
	let dhtPeers = await getDHTPeerList(parsedTorrent);
	console.log("Got DHT peers " + dhtPeers.length)
	let trackerPeers = await getTrackerPeerList(parsedTorrent);
	console.log("Got tracker peers " + trackerPeers.length);
	let cleanPeerList = cleanPeers([dhtPeers, trackerPeers]);
	console.log("Final peer length: " + cleanPeerList.length);
}

async function getTorrents() {

}

function cleanPeers(arr) {
	let cat = [].concat.apply([], arr);
	for (let i = 0; i < cat.length; i++) {
		cat[i] = cat[i].split(":")[0]
	}
	let fin = [...new Set(cat)];
	return fin;
}