const OCCURENCES = 4;
const TIME_FRAME_SEC = 80;

class PirModule {
	constructor(config) {
		this.config = config;
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
		
		let trigger = device.trigger;

		console.log(device.location + " PIR triggered" + (trigger?.triggered?" (Suppressed)":""));

		SmartHub.database.query('INSERT INTO rf_bridge_log (device, message) values( ?, ? )', [message.RfReceived.Data, JSON.stringify(msg)], (error, results, fields) => {
			if (error) {
				console.log(error);
			}
		});

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

		//remove all old times
		trigger.times = trigger.times.filter( t => (Date.now() - t) < (TIME_FRAME_SEC * 1000));

		if (trigger.times.length >= OCCURENCES) {
			trigger.triggered = true;
			SmartHub.mqttClient.publish(device.topic, JSON.stringify(trigger));
			setTimeout(this.clearTrigger, 5*60*1000, device);
		}
	}

	subscribe() {
		console.log("Subscribing to " + this.config.topic);
		SmartHub.mqttClient.subscribe(this.config.topic);
		SmartHub.mqttClient.on('message',this.onMessage.bind(this));
	}

	onMessage(topic, message) {
		if (topic.startsWith(this.config.topic)) {
			this.tiggerAlarm(message.toString());
		}
	}

}

PirModule.init = function() {
	if (!SmartHub.config.pir) {
		console.log("No PIR configuration found");
		return;
	}
	let pirModule = new PirModule(SmartHub.config.pir);
	pirModule.subscribe();
	return pirModule;

}


module.exports = PirModule;
