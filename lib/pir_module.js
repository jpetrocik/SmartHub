var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'hermes.petrocik.net',
  user     : 'john',
  password : 'oropez',
  database : 'smarthub'
});
 
connection.connect();

const mqtt = require('mqtt');

class RfModule {
	constructor(config, mqttClient) {
		this.config = config;
		this.mqttClient = mqttClient;
	}


	clearTrigger(device) {
		console.log("Clearing trigger for " + device.name);
		device.triggered = false;
	}

	tiggerAlarm(msg) {
		let message = JSON.parse(msg);
		let device = this.config.devices[message.RfReceived.Data];

		if (device)
			connection.query('INSERT INTO rf_bridge_log (device, message) values( ?, ? )', device, msg);

		if (device && !device.triggered) {
			device.triggered = true;
			setTimeout(this.clearTrigger, 60*1000, device);
			this.mqttClient.publish(device.topic, device.message);
		}
	}

	subscribe() {
		console.log("Subscribing to " + this.config.topic);
		this.mqttClient.subscribe(this.config.topic);
		this.mqttClient.on('message',this.onMessage.bind(this));
	}

	onMessage(topic, message) {
		if (topic.startsWith(this.config.topic)) {
			console.log("PIR triggered " + topic);
			this.tiggerAlarm(message.toString());
		}
	}

}

PirModule.init = function(SmartHub) {
	let pirModule = new PirModule(SmartHub.config.pir, SmartHub.mqttClient);
	pirModule.subscribe();
	return pirModule;

}


module.exports = PirModule;