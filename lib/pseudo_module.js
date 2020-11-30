
class PseduoSwitch {

	constructor(config, mqttClient) {
		this.devices = config;
		this.mqttClient = mqttClient;
	}

	processCommand(device, command) {
		if (command == 3) {
			console.log('Sending status ' + device.status);
			this.mqttClient.publish(device.status,'{"status":"OFF"}');
		} else if (command == 1) {
			Object.keys(device.messages).forEach(function(key) {
				console.log('Sending command ' + key + ' ' + device.messages[key]);
				this.mqttClient.publish(key,device.messages[key]);
			}, this);
			this.mqttClient.publish(device.status,'{"status":"ON"}');
			//setTimeout(() => {this.mqttClient.publish(device.status,'{"status":"OFF"}');}, 2000);
		} else if (command == 0) {
			Object.keys(device.messages).forEach(function(key) {
				console.log('Sending command ' + key + ' 0');
				this.mqttClient.publish(key,"0");
			}, this);
			this.mqttClient.publish(device.status,'{"status":"OFF"}');
		}
	}

	subscribe() {
		let mqttClient = this.mqttClient;
		Object.keys(this.devices).forEach(function(key) {
			console.log("Subscribing to " + key);
			mqttClient.subscribe(key);
		});

		mqttClient.on('message',this.onMessage.bind(this));
	}

	onMessage(topic, message) {
		var command = message.toString();
		if (this.devices[topic]) {
			console.log("Message recieved on " + topic);
			this.processCommand(this.devices[topic], command);
		}
	}

};

PseduoSwitch.init = function(){
	let pseduoSwitch = new PseduoSwitch(SmartHub.config.pseduo, SmartHub.mqttClient);
	pseduoSwitch.subscribe();
	return pseduoSwitch;
};


module.exports = PseduoSwitch;
