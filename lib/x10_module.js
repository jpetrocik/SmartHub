const x10 = require('node-x10-comm');
const fs = require('fs');

class X10Module extends MqttDevice {

	constructor(mqttClient) {
		this.mqttClient = mqttClient;
		this.x10device = x10.device();
	}

	processCommand(device, command) {
		console.log('Process ' + device.house + device.module);
		if (command == 3) {
			console.log('Sending status command ' + device.house + device.module);
			var status = fs.existsSync('/var/lock/X10/' + device.house + device.module + ".on")?"ON":"OFF";
			mqttClient.publish(device.status,'{"status":"' + status + '"}');

		} else {
			x10device.open(config.serialPort, () => {
				x10device.sendCommand(device.house.charCodeAt(0) - 'A'.charCodeAt(0), device.module - 1, parseInt(command), () => {
						if (command == 1) {
							console.log('Turned on ' + device.house + device.module);
							fs.closeSync(fs.openSync('/var/lock/X10/' + device.house + device.module + ".on", 'w'));
							mqttClient.publish(device.status,'{"status":"ON"}');
						} else if (command == 0) {
							console.log('Turned off ' + device.house + device.module);
							fs.unlink('/var/lock/X10/' + device.house + device.module + ".on", (err) => {});
							mqttClient.publish(device.status,'{"status":"OFF"}');
						}
					}, () => {
						console.log('X10 command failed');
					});
			}, (err) => {
		 		console.log("Failed to open " + config.serialPort);
		 		console.log("Details");
		 		console.log(err);
			});
		}
	}

	subscribe() {
		let mqttClient = this.mqttClient;

		console.log("Subscribing to house/command");
		mqttClient.subscribe("house/command");
		Object.keys(config.topics).forEach(function(key) {
			console.log("Subscribing to " + key);
			mqttClient.subscribe(key);
		});
	}

	onMessage(topic, message) {
		console.log("Message recieved on " + topic);
		if (topic == "house/command") {
			var command = message.toString();
			Object.keys(config.topics).forEach(function(key) {
				processCommand(config.topics[key], command);
			});
		} else {
			var command = message.toString();
			var device = config.topics[topic];
			processCommand(device, command);
		}
	}
};

X10Module.init = function(SmartHub){
	let x10Module = new X10Module(SmartHub.config.x10, SmartHub.mqttClient);
	x10Module.subscribe();
	return x10Module;
};