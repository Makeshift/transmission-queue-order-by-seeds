const bencode = require('bencode');
const request = require('request');
const dgram = require('dgram');
const config = require('./config').tracker;

function getPeerList(torrent) {
	return new Promise(async (resolve, reject) => {
			let peerArr = [];
			let extraCount = [];
			for (let i = 0; i < torrent.announce.length; i++) {
				if (torrent.announce[i].includes("udp://")) {
					extraCount.push(doAnnounceGetPeersUDP(torrent.infoHash, torrent.announce[i]))
				} else if (torrent.announce[i].includes("http://") || torrent.announce[i].includes("https://")) {
					peerArr.push(doAnnounceGetPeers(torrent.encodedInfoHash, torrent.announce[i]))
				} else {
					console.log(`${torrent.announce[i]}: Unknown tracker type! Skipping`)
				}
			}
			[peerArr = await Promise.all(peerArr), extraCount = await Promise.all(extraCount)];

			let totalPeers = getUniqueCount(peerArr) + extraCount.reduce((a, v) => a + v);
			console.log(totalPeers);
			resolve(totalPeers)
	})
}

function getUniqueCount(peers) {
	//Merge array of arrays
	peers = [].concat.apply([], peers);
	if (config.uniquePeers) {
		//Remove ports
		for (let i = 0; i < peers.length; i++) {
			peers[i] = peers[i].split(":")[0];
		}
		//Unique
		peers = [...new Set(peers)]
	}
	return peers.length
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

function doAnnounceGetPeersUDP(hash, tracker) {
	return new Promise(async (resolve) => {
		let preHost = tracker.split("udp://")[1];
		let host = preHost.split(":")[0];
		let port = preHost.split(":")[1];
		let path = "";
		if (port.includes("/")) {
			path = port.split("/")[1];
			port = port.split("/")[0];
		}
		const udpserver = dgram.createSocket('udp4');
		resolve(await getPeersCountFromUDPTracker(udpserver, hash, host, port))
		udpserver.close();
	})
}

function sendUDPPacket(server, buf, host, port) {
	server.send(buf, 0, buf.length, port, host, (err, bytes) => {
		if (err) console.log(err);
	})
}

function getPeersCountFromUDPTracker(server, hash, host, port) {
	return new Promise((resolve) => {
		server.on("message", function (msg, rinfo) {
		    let buf = new Buffer.from(msg)
		    let action = buf.readUInt32BE(0);

		    if (action === 0) {
		    	//Connection response
		        let connectionIdHigh = buf.readUInt32BE(8);
		        let connectionIdLow = buf.readUInt32BE(12);
		        //announceTorrent(server, host, port, hash, connectionIdLow, connectionIdHigh, Math.floor((Math.random()*2147483645)+1));
		        scrapeTorrent(server, host, port, hash, connectionIdLow, connectionIdHigh, Math.floor((Math.random()*2147483645)+1))
		    } else if (action === 1) {
		    	//Unusued, but keeping for posterity reasons - Announce response
		        let response = {
			        interval: buf.readUInt32BE(8),
			        leechers: buf.readUInt32BE(12),
			        seeders: buf.readUInt32BE(16),
		        }
			    if (buf.byteLength > 20) {
			    	response.ip = `${buf.readInt8(20)}.${buf.readInt8(21)}.${buf.readInt8(22)}.${buf.readInt8(23)}`;
			    	response.port =  buf.readUInt16BE(24)
			    }
		        console.log(response);
		    } else if (action === 2) {
		    	//Scrape response
		    	let response = buf.readUInt32BE(8) + buf.readUInt32BE(16)
		    	//console.log(response);
		    	resolve(response);
		    } else if (action === 3) {
		        console.log("error response");
		        //Bits 8+ are the error string but I was too lazy to parse it
		    } else {
		    	console.log("Unknown action response: " + action)
		    }
		});
		let buf = new Buffer.alloc(16).fill(0);
		buf.writeUInt32BE(0x417, 0);
		buf.writeUInt32BE(0x27101980, 4);
		buf.writeUInt32BE(0, 8);
		buf.writeUInt32BE(Math.floor((Math.random()*2147483645)+1), 12);
		sendUDPPacket(server, buf, host, port);
		setTimeout(() => {
			//Will be ignored if it's already fired
			resolve(0);
		}, config.waitTime)
	})
}

function scrapeTorrent(server, host, port, hash, low, high, transactionId) {
	let buf = new Buffer.alloc(36).fill(0);
	buf.writeUInt32BE(high, 0);
	buf.writeUInt32BE(low, 4);
	buf.writeUInt32BE(2, 8);
	buf.writeUInt32BE(transactionId, 12);
	buf.write(hash, 16, 20, 'hex');
	sendUDPPacket(server, buf, host, port);
}

//TODO Announce for an actual peer list
// function announceTorrent(server, host, port, hash, low, high, transactionId) {
// 	console.log("Anncouning at " + host)
// 	let buf = new Buffer.alloc(98).fill(0);
//     buf.writeUInt32BE(high, 0); //conn_id 1
//     buf.writeUInt32BE(low, 4); //conn_id 2
//     buf.writeUInt32BE(1, 8); //action announce
//     buf.writeUInt32BE(transactionId, 12); //Transaction ID
//     buf.write(hash, 16, 20, 'hex'); //info_hash
//     buf.write("12345678901234567890", 16, 20); //peer_id
//     buf.writeUInt32BE(0, 56); //downloaded 1
//     buf.writeUInt32BE(0, 60); //downloaded 2
//     buf.writeUInt32BE(0, 64); //left 1
//     buf.writeUInt32BE(0, 68); //left 2
//     buf.writeUInt32BE(0, 72); //uploaded 1
//     buf.writeUInt32BE(0, 76); //uploaded 2
//     buf.writeUInt32BE(2, 80); //event none
//     buf.writeUInt32BE(0, 88); //Key?
//     buf.writeUInt32BE(10, 92) //num_want
//     buf.writeUInt16BE(1234, 96); //port
//     sendUDPPacket(server, buf, host, port);
// }

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