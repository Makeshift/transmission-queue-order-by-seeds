const bencode = require('bencode');
const request = require('request');

function getPeerList(torrent) {
	return new Promise(async (resolve, reject) => {
			let peerArr = [];
			for (let i = 0; i < torrent.announce.length; i++) {
				peerArr.push(doAnnounceGetPeers(torrent.encodedInfoHash, torrent.announce[i]))
			}
			peerArr = await Promise.all(peerArr);
			let totalPeers = [...new Set([].concat.apply([], peerArr))]
			resolve(totalPeers)
	})
}

function getOwnIp() {
	return new Promise(resolve => {
		request.get("https://checkip.amazonaws.com", function(err, res, body) {
			resolve(body);
		})
	});
}

function doAnnounceGetPeers(hash, tracker) {
	return new Promise ((resolve, reject) => {
		let default_qs = "&peer_id=12345678901234567890&port=1&uploaded=0&downloaded=0&left=0&event=started&compact=1&numwant=1000&ip=172.16.0.1"
		request({
			url: `${tracker}?info_hash=${hash}${default_qs}`,
			method: "GET",
			encoding: null
		}, function(err, res, body) {
			if (err) {
				console.log(`Tracker ${tracker} is dead, skipping...`)
				resolve([]);
			} else {
				resolve(parsePeers(bencode.decode(body).peers));
			}
		});
	});
}

function parsePeers(peers) {
	let p = Buffer.from(peers, 'latin1');
	let peerList = [];
	for (let i = 0; i < p.length; i += 6) {
		let peer = `${p[i]}.${p[i+1]}.${p[i+2]}.${p[i+3]}:${(p[i + 4] << 8 | p[i + 5])}`
		peerList.push(peer);
	}
	return peerList;
}

module.exports = getPeerList;