let config = {
	dht: {
		waitTime: 	process.env["dhtWaitTime"] 					|| 10000, //Time in ms to wait for DHT per torrent
		portStart: 	process.env["dhtPortStart"] 				|| 10000, //Random start port range for listening
		portEnd: 	process.env["dhtPortEnd"] 					|| 60000 //Random end port range for listening
	},
	transmission: {
		protocol: 	process.env["transmissionProtocol"] 		|| "http:", //or https
		host: 		process.env["transmissionHost"] 			|| "",
		path: 		process.env["transmissionPath"] 			|| "/transmission/rpc",
		port: 		process.env["transmissionPort"] 			|| 9091,
		username: 	process.env["transmissionUsername"] 		|| "",
		password: 	process.env["transmissionPassword"] 		|| ""
	},
	uniquePeers: 	process.env["transmissionOrderUniquePeers"] || true //true: counts peers based on IP, ignores ports; false: includes ports, so clients announcing on multiple ports will be counted as multiple peers
}

//Used to override transmission config in development
const fileExists = require('file-exists');
if (fileExists("config.overrides.js")) {
	config.transmission = {...config.transmission, ...require("./config.overrides").transmission}
}
module.exports = config;