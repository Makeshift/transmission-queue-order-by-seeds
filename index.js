const parseTorrent = require('./parseTorrent');
const getTrackerPeerList = require('./getTrackerPeerList');
const getDHTPeerList = require('./getDHTPeerList');
const transmission = require('./transmission');
const config = require('./config');

function getPeers(torrent) {
	return new Promise(async (resolve, reject) => {
		let parsedTorrent = await parseTorrent(torrent);
		console.log(parsedTorrent);
		let dhtPeers = await getDHTPeerList(parsedTorrent);
		console.log("Got DHT peers " + dhtPeers.length)
		let trackerPeers = await getTrackerPeerList(parsedTorrent);
		console.log("Got tracker peers " + trackerPeers.length);
		let cleanPeerList = cleanPeers([dhtPeers, trackerPeers]);
		console.log("Final peer length: " + cleanPeerList.length);
	})
}

// async function sortAllTorrents() {
// 	let torrents = await transmission.getTorrents();
// 	for (let i = 0; i < torrents.length; i++) {
// 		getPeers(torrents[i].magnet);
// 	}
// 	console.log(torrents);
// }


function cleanPeers(arr) {
	let cat = [].concat.apply([], arr);
	if (config.uniquePeers) {
		for (let i = 0; i < cat.length; i++) {
			cat[i] = cat[i].split(":")[0]
		}
		console.log(cat)
		cat = [...new Set(cat)];
		console.log(cat)
	}
	return cat;
}

//sortAllTorrents();
