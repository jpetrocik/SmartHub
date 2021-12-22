const mysqlPool = require('./mysql.js');

class PirModule {
	constructor(config, mqttClient) {
		this.config = config;
		this.mqttClient = mqttClient;
	}


	clearTrigger(device) {
		console.log("Clearing trigger for " + device.location);
		delete device.trigger;
	}

	tiggerAlarm(msg) {
		let message = JSON.parse(msg);
		let device = this.config.devices[message.RfReceived.Data];

		if (!device)
			return;
		
		console.log(device.location + " PIR triggered");

		mysqlPool.query('INSERT INTO rf_bridge_log (device, message) values( ?, ? )', [message.RfReceived.Data, JSON.stringify(msg)], (error, results, fields) => {
			if (error) {
				console.log(error);
			}
		});

		if (!device.trigger) {
			device.trigger = new Object();
			device.trigger.count = 1;
			device.trigger.time = Date.now();
			setTimeout(this.clearTrigger, 60*1000, device);
			return;
		}

		let trigger = device.trigger;

		trigger.count += 1;

		let triggerWindow = Date.now() - trigger.time;
		if (!trigger.triggered && trigger.count >= 3 && triggerWindow < 60000) {
			trigger.triggered = true;
			this.mqttClient.publish(device.topic, JSON.stringify(trigger));
		}
	}

	subscribe() {
		console.log("Subscribing to " + this.config.topic);
		this.mqttClient.subscribe(this.config.topic);
		this.mqttClient.on('message',this.onMessage.bind(this));
	}

	onMessage(topic, message) {
		if (topic.startsWith(this.config.topic)) {
			this.tiggerAlarm(message.toString());
		}
	}

}

PirModule.init = function() {
	let pirModule = new PirModule(SmartHub.config.pir, SmartHub.mqttClient);
	pirModule.subscribe();
	return pirModule;

}


module.exports = PirModule;