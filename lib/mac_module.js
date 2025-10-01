class MacModule {

	constructor() {
		this.config = SmartHub.config.mac;
	}

	processMessage(msg) {

		SmartHub.database.query('INSERT INTO mac_address_log (mac_address, rssi) values(?, ?)', [msg.mac, msg.rssi], (error, results, fields) => {
			if (error) {
				console.log(error);
			}
		});

	}

	subscribe() {
		console.log("Setting up monitoring on " + this.config.topic);
		SmartHub.mqttClient.subscribe(this.config.topic);

		SmartHub.mqttClient.on('message', this.onMessage.bind(this));
	}

	onMessage(topic, message) {
		if (topic == this.config.topic) {
			this.processMessage(JSON.parse(message.toString()));
		}
	}

};

MacModule.init = function () {
	if (!SmartHub.config.mac) {
		console.log("No MAC configuration found");
		return;
	}
	let macModule = new MacModule();
	macModule.subscribe();
	return macModule;
};


module.exports = MacModule;
