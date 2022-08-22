const pool = require('./mysql.js');

class MacModule {

	constructor() {
		this.config = SmartHub.config.mac;
		this.mqttClient = SmartHub.mqttClient;
	}

	processMessage(msg) {

		pool.query('INSERT INTO mac_address_log (mac_address, rssi) values(?, ?)', [msg.mac, msg.rssi], (error, results, fields) => {
			if (error) {
				console.log(error);
			}
		});

	}

	subscribe() {
		let mqttClient = this.mqttClient;
        console.log("Setting up monitoring on " + this.config.topic);
        mqttClient.subscribe(this.config.topic);

		mqttClient.on('message',this.onMessage.bind(this));
	}

	onMessage(topic, message) {
		if (topic == this.config.topic) {
            this.processMessage(JSON.parse(message.toString()));
		}
	}

};

MacModule.init = function(){
	let macModule = new MacModule();
	macModule.subscribe();
	return macModule;
};


module.exports = MacModule;
