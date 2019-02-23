const parseTorrent = require('parse-torrent');
const fs = require('fs');
const bencode = require('bencode');
const request = require('request');
const fileExists = require('file-exists');

function getPeerList(input) {
	return new Promise((resolve, reject) => {
		let torrent;
		fileExists(input).then(async exists => {
			if (exists) {
				torrent = parseTorrent(fs.readFileSync(input));
			} else if (input.includes("magnet:")) {
				torrent = parseTorrent(input)
			} else {
				reject("Unknown torrent type! I only understand filepaths to torrents and magnet links.")
			}
			let infoHash = encodeInfoHash(torrent.infoHash);
			let peerArr = [];
			for (let i = 0; i < torrent.announce.length; i++) {
				peerArr.push(doAnnounceGetPeers(infoHash, torrent.announce[i]))
			}
			peerArr = await Promise.all(peerArr);
			let totalPeers = [...new Set([].concat.apply([], peerArr))]
			resolve(totalPeers)
		})
	})
}

function getOwnIp() {
	return new Promise(resolve => {
		request.get("https://checkip.amazonaws.com", function(err, res, body) {
			resolve(body);
		})
	});
}

function encodeInfoHash(hash) {
	let chunks = function chunk(array) {
		if (!array.length) return [];
  		return [array.slice(0, 2), ...chunk(array.slice(2), 2)];
	}(hash);
	let encoded = "";
	for (let i = 0; i < chunks.length; i++) {
		let dec = parseInt(chunks[i], 16);
		if ((dec >= 65 && dec <= 90) || //A-Z
			(dec >= 97 && dec <= 122) || //a-z
			(dec >= 48 && dec <= 57) || //0-9 
			(dec === 45) || (dec === 95) || (dec === 46) || (dec === 126) // -_.~
			) 
		{
			encoded += String.fromCharCode(dec);
		} else {
			encoded += "%" + chunks[i]
		}
	}
	return encoded;
}

function doAnnounceGetPeers(hash, tracker) {
	return new Promise ((resolve, reject) => {
		let default_qs = "&peer_id=12345678901234567890&port=6881&uploaded=0&downloaded=0&left=0&event=started&compact=1&numwant=1000"
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