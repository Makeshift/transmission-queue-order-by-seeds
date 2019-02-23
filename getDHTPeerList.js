const DHT = require('bittorrent-dht');
let dht = new DHT();

module.exports = function(torrent) {
	return new Promise((resolve, reject) => {
		let dht = new DHT();
		dht.lookup(torrent.infoHash);
		let peers = [];
		dht.on('peer', (peer, infoHash, from) => {
			peers.push(`${peer.host}:${peer.port}`)
		})
		dht.listen(genRandomPort());
		setTimeout(() => {
			dht.destroy(() => {
				resolve(peers);
			})
		}, 10000)
	})
}

let usedPorts = [];
let min = 20000;
let max = 60000;

function genRandomPort() {
	let rand = Math.floor(Math.random() * (max - min)) + min;
	if (usedPorts.includes(rand)) {
		rand = genRandomPort();
	}
	return rand;
}