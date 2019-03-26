/*jslint node:true nomen:true*/
'use strict';
var util = require('util'),
    eiscp = require('eiscp');

// eiscp.on('debug', util.log);
eiscp.on('error', util.log);

// // Discover receviers on network, stop after 2 receviers or 5 seconds
// eiscp.discover({devices: 1, timeout: 5}, function (err, result) {
	
// 	if(err) {
// 		console.log("Error message: " + result);
// 	} else {
// 		console.log("Found these receivers on the local network:");
// 		console.dir(result);
// 	}
// });

let connected = false;
function connect() {
	return new Promise((resolve, reject) => {
		console.log("Connecting....")

		eiscp.connect();

		eiscp.on('connect', function (ipAddress, port, model) {
			console.log("Connected to " + model)
			connected = true;
			resolve();
		});

		eiscp.on('data', function (arg) {
		    console.log(arg);
		});
	});
}

class OnkyoModule {
	constructor(config, mqttClient) {
		this.config = config;
		this.mqttClient = mqttClient;
	}

	sendCommand(command, data) {
		return new Promise((resolve, reject) => {
			let commandToExecute = function() {
				console.log("Sending " + command);
			    eiscp.command(command, data, () => {
			    	resolve();
			    });
			}

			if (connected) {
				commandToExecute();
			} else {
				connect().then(() => { commandToExecute()} );
			}
		});

	}

	powerOn() {
	    return this.sendCommand("PWR", "01");
	}

	powerOff() {
	    return this.sendCommand("PWR", "00");
	}

	volume(level) {
	    return this.sendCommand("MVL", level);
	}

	input(selection) {
	    return this.sendCommand("SLI", selection);
	}

	subscribe() {
		console.log("Subscribing to " + this.config.topic);
		this.mqttClient.subscribe(this.config.topic + "/#");
		this.mqttClient.on('message',this.onMessage.bind(this));
	}

	onMessage(topic, message) {
		if (topic.startsWith(this.config.topic)) {
			console.log("Message recieved on " + topic);
			var command = topic.replace(this.config.topic + "/","");
			this.sendCommand(command, message);
		}
	}


}

OnkyoModule.init = function(SmartHub){
	let onkyoModule = new OnkyoModule(SmartHub.config.onkyo, SmartHub.mqttClient);
	onkyoModule.subscribe();
	return onkyoModule;
};

module.exports = OnkyoModule;
