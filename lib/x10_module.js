const x10 = require('node-x10-comm');
const fs = require('fs');

class X10Module {

	constructor(config, mqttClient) {
		this.config = config;
		this.mqttClient = mqttClient;
		this.x10device = x10.device();
	}

	processCommand(device, command) {
		console.log('Process ' + device.house + device.module);
		if (command == 3) {
			console.log('Sending status command ' + device.house + device.module);
			var status = fs.existsSync('/var/lock/X10/' + device.house + device.module + ".on")?"ON":"OFF";
			this.mqttClient.publish(device.status,'{"status":"' + status + '"}');

		} else {
			this.x10device.open(this.config.serialPort, () => {
				this.x10device.sendCommand(device.house.charCodeAt(0) - 'A'.charCodeAt(0), device.module - 1, parseInt(command), () => {
						if (command == 1) {
							console.log('Turned on ' + device.house + device.module);
							fs.closeSync(fs.openSync('/var/lock/X10/' + device.house + device.module + ".on", 'w'));
							this.mqttClient.publish(device.status,'{"status":"ON"}');
						} else if (command == 0) {
							console.log('Turned off ' + device.house + device.module);
							fs.unlink('/var/lock/X10/' + device.house + device.module + ".on", (err) => {});
							this.mqttClient.publish(device.status,'{"status":"OFF"}');
						}
					}, () => {
						console.log('X10 command failed');
					});
			}, (err) => {
		 		console.log("Failed to open " + this.config.serialPort);
		 		console.log("Details");
		 		console.log(err);
			});
		}
	}

	subscribe() {
		console.log("Subscribing to house/command");
		this.mqttClient.subscribe("house/command");
		Object.keys(this.config.topics).forEach(function(key) {
			console.log("Subscribing to " + key);
			this.mqttClient.subscribe(key);
		}, this);

		this.mqttClient.on('message',this.onMessage.bind(this));
	}

	onMessage(topic, message) {
		if (topic == "house/command") {
			console.log("Message recieved on " + topic);
			var command = message.toString();
			Object.keys(this.config.topics).forEach(function(key) {
				this.processCommand(this.config.topics[key], command);
			}, this);
		} else {
			var command = message.toString();
			var device = this.config.topics[topic];
			if (device) {
				console.log("Message recieved on " + topic);
				this.processCommand(device, command);
			}
		}
	}
};

X10Module.init = function(SmartHub){
	let x10Module = new X10Module(SmartHub.config.x10, SmartHub.mqttClient);
	x10Module.subscribe();
	return x10Module;
};

module.exports = X10Module;
