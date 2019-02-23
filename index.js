const parseTorrent = require('parse-torrent');
const fs = require('fs');
const bencode = require('bencode');
const request = require('request');
const convertString = require('convert-string').UTF8.stringToBytes;

//let magnet = "magnet:?xt=urn:btih:34930674ef3bb9317fb5f263cca830f52685235b&dn=%5Bzooqle.com%5D%20Ahockalypse%202018%20HDRip%20AC3%20X264-CMR&tr=http%3A%2F%2Fexplodie.org%3A6969%2Fannounce&tr=http%3A%2F%2Ftracker1.itzmx.com%3A8080%2Fannounce&tr=http%3A%2F%2Fannounce.xxx-tracker.com%3A2710%2Fannounce&tr=http%3A%2F%2Ftracker1.wasabii.com.tw%3A6969%2Fannounce&tr=http%3A%2F%2Fopen.acgtracker.com%3A1096%2Fannounce";

//let torrent = parseTorrent(magnet);

function getPeers(input) {
	let torrent;
	if (fs.lstatSync(input).isFile()) {
		torrent = parseTorrent(fs.readFileSync(input));
	} else if (input.includes("magnet:")) {
		torrent = parseTorrent(input)
	} else {
		throw "Unknown torrent type! I only understand filepaths to torrents and magnet links."
	}
	getTorrentAnnounce(encodeInfoHash(torrent.infoHash), "http://torrent.ubuntu.com:6969/announce")
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

function getTorrentAnnounce(hash, tracker) {
	let default_qs = "&peer_id=12345678901234567890&port=6881&uploaded=0&downloaded=0&left=0&event=started&compact=1&numwant=1000"
	request({
		url: `${tracker}?info_hash=${hash}${default_qs}`,
		method: "GET",
		encoding: null
	}, function(err, res, body) {
		if (err) {
			console.log(err)
		} else {
			console.log(body.toString());
			let peers = bencode.decode(body).peers;
			for (let i = 0; i < peers.length; i++) {
				console.log(peers[i].toString(2))
			}
			
			//console.log(peers);
		}
	});
}

// Shamelessly stolen from https://stackoverflow.com/a/51904484/1487207
function strToUtf8Bytes(str) {
  const utf8 = [];
  for (let ii = 0; ii < str.length; ii++) {
    let charCode = str.charCodeAt(ii);
    if (charCode < 0x80) utf8.push(charCode);
    else if (charCode < 0x800) {
      utf8.push(0xc0 | (charCode >> 6), 0x80 | (charCode & 0x3f));
    } else if (charCode < 0xd800 || charCode >= 0xe000) {
      utf8.push(0xe0 | (charCode >> 12), 0x80 | ((charCode >> 6) & 0x3f), 0x80 | (charCode & 0x3f));
    } else {
      ii++;
      // Surrogate pair:
      // UTF-16 encodes 0x10000-0x10FFFF by subtracting 0x10000 and
      // splitting the 20 bits of 0x0-0xFFFFF into two halves
      charCode = 0x10000 + (((charCode & 0x3ff) << 10) | (str.charCodeAt(ii) & 0x3ff));
      utf8.push(
        0xf0 | (charCode >> 18),
        0x80 | ((charCode >> 12) & 0x3f),
        0x80 | ((charCode >> 6) & 0x3f),
        0x80 | (charCode & 0x3f),
      );
    }
  }
  return utf8;
}

getPeers("ubuntu-14.04.5-desktop-amd64.iso.torrent");