const DHT = require('bittorrent-dht');
const config = require('./config').dht;

let max = config.portEnd;

let counter = config.portStart;

module.exports = function(torrent) {
	return new Promise(async (resolve, reject) => {
		let dht = new DHT();
		let peers = [];
		dht.on('peer', (peer, infoHash, from) => {
			peers.push(`${peer.host}:${peer.port}`)
		});
		let port = counter++;
		if (counter > max) {
			counter = config.portStart;
		}
		dht.listen(port, function() {
			dht.lookup(torrent.infoHash);
		});
		
		setTimeout(() => {
			dht.destroy(() => {
				resolve(peers.length);
			})
		}, config.waitTime)
	})
}

