const fileExists = require('file-exists');
const parseTorrent = require('parse-torrent');
const fs = require('fs');


module.exports = function(input) {
	return new Promise((resolve, reject) => {
		let torrent;
		fileExists(input).then(exists => {
			if (exists) {
				torrent = parseTorrent(fs.readFileSync(input));
			} else if (input.includes("magnet:")) {
				torrent = parseTorrent(input)
			} else {
				reject("Unknown torrent type! I only understand filepaths to torrents and magnet links.")
			}
			torrent.encodedInfoHash = encodeInfoHash(torrent.infoHash);
			resolve(torrent);
		})
	})
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