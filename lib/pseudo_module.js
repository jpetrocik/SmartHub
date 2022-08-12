
class PseduoSwitch {

	constructor(config, mqttClient) {
		this.config = config;
		this.mqttClient = mqttClient;
	}

	processCommand(pseduo, message) {
		let matchPseduo = pseduo.filter( p => eval(p.expression??"true"));
		
		matchPseduo.forEach( p => {
			Object.keys(p.messages).forEach(function(key) {
				console.log('Sending command ' + key + ' ' + p.messages[key]);
				this.mqttClient.publish(key, p.messages[key]);
			}, this);
		});
	}

	subscribe() {
		let mqttClient = this.mqttClient;
		Object.keys(this.config).forEach(function(key) {
			console.log("Subscribing to " + key);
			mqttClient.subscribe(key);
		});

		mqttClient.on('message',this.onMessage.bind(this));
	}

	onMessage(topic, message) {
		var command = message.toString();
		if (this.config[topic]) {
			console.log("Message recieved on " + topic);
			this.processCommand(this.config[topic], command);
		}
	}

};

PseduoSwitch.init = function(){
	let pseduoSwitch = new PseduoSwitch(SmartHub.config.pseduo, SmartHub.mqttClient);
	pseduoSwitch.subscribe();
	return pseduoSwitch;
};


module.exports = PseduoSwitch;
