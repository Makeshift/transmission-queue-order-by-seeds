const DHT = require('bittorrent-dht');
const config = require('./config').dht;

module.exports = function(torrent) {
	return new Promise(async (resolve, reject) => {
		let dht = new DHT();
		dht.lookup(torrent.infoHash);
		let peers = [];
		dht.on('peer', (peer, infoHash, from) => {
			peers.push(`${peer.host}:${peer.port}`)
		})
		dht.listen(await genRandomPort());
		setTimeout(() => {
			dht.destroy(() => {
				resolve(peers.length);
			})
		}, config.waitTime)
	})
}

let usedPorts = [];
let min = config.portStart;
let max = config.portEnd;

function genRandomPort() {
	return new Promise(async (resolve, reject) => {
		let rand = Math.floor(Math.random() * (max - min)) + min;
		if (usedPorts.includes(rand)) {
			rand = await genRandomPort();
		}
		resolve(rand);
	})
}