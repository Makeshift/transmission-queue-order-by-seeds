const transmission = require('transmission-api');
const config = require('./config').transmission;

module.exports = {
	getTorrents: getTorrents
}

function getTorrents() {
	return new Promise(async (resolve) => {
		let client = new transmission.Client("Initial Session ID", config);
		let torrents = await client.getAllTorrents();
		resolve(getSimplifiedTorrentInfo(torrents));
	})
}

function getSimplifiedTorrentInfo(torrents) {
	let simple = [];
	for (let i = 0; i < torrents.length; i++) {
		simple.push({
			magnet: torrents[i]._torrent.magnetLink,
			id: torrents[i]._torrent.id
		})
	}
	return simple;
}