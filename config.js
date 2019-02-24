let config = {
	concurrency: 	process.env["globalConcurrency"] 			|| 250, //How many concurrent torrents we should be processing
	removeNoPeers:  process.env["globalRemoveNoPeers"]			|| true,
	pauseAllSeeding:process.env["globalPauseAllSeeding"]		|| true,
	dht: {
		waitTime: 	process.env["dhtWaitTime"] 					|| 10000, //Time in ms to wait for DHT per concurrent set
		portStart: 	process.env["dhtPortStart"] 				|| 40500, //Random start port range for listening
		portEnd: 	process.env["dhtPortEnd"] 					|| 41000, //Random end port range for listening
		concurrency:process.env["dhtConcurrency"]				|| 1000 //How much you want to hammer DHT
	},
	tracker: {
		waitTime:   process.env["trackerWaitTime"]              || 10000, //Time in ms to wait for a UDP tracker to respond
		//uniquePeers:process.env["transmissionOrderUniquePeers"] || true //true: counts peers based on IP, ignores ports; false: includes ports, so clients announcing on multiple ports will be counted as multiple peers
	},
	transmission: {
		ssl: 	process.env["transmissionSsl"] 					|| false, //or https
		host: 		process.env["transmissionHost"] 			|| "",
		path: 		process.env["transmissionPath"] 			|| "/transmission/rpc",
		port: 		process.env["transmissionPort"] 			|| 9091,
		username: 	process.env["transmissionUsername"] 		|| "",
		password: 	process.env["transmissionPassword"] 		|| ""
	}
}

//Used to override transmission config in development
const fileExists = require('file-exists');
if (fileExists("config.overrides.js")) {
	config.transmission = {...config.transmission, ...require("./config.overrides").transmission}
}
module.exports = config;