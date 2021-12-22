const mysqlPool = require('./mysql.js');

const OCCURENCES = 3;
const TIME_FRAME_SEC = 60;

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

		let trigger = device.trigger;
		if (trigger?.triggered)
			return;

		if (!trigger) {
			trigger = device.trigger = new Object();
			trigger.times = [];
			trigger.times.push(Date.now());
			return;
		} else {
			trigger.times.push(Date.now());
		}


		trigger.times = trigger.times.filter( t => (Date.now() - t) < (TIME_FRAME_SEC * 1000));

		if (trigger.times.length >= OCCURENCES) {
			trigger.triggered = true;
			//this.mqttClient.publish(device.topic, JSON.stringify(trigger));
			setTimeout(this.clearTrigger, 5*60*1000, device);
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