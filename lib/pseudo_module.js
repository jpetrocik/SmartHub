
class PseduoSwitch {

	constructor(config) {
		this.config = config;
	}

	processCommand(pseduo, message) {
		let matchPseduo = pseduo.filter( p => eval(p.expression??"true"));
		
		matchPseduo.forEach( p => {
			Object.keys(p.messages).forEach(function(key) {
				console.log('Sending command ' + key + ' ' + p.messages[key]);
				SmartHub.mqttClient.publish(key, p.messages[key]);
			}, this);
		});
	}

	subscribe() {
		Object.keys(this.config).forEach(function(key) {
			console.log("Subscribing to " + key);
			SmartHub.mqttClient.subscribe(key);
		});

		SmartHub.mqttClient.on('message',this.onMessage.bind(this));
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
	if(!SmartHub.config.pseduo) {
		console.log("No pseduo configuration found");
		return;
	}
	let pseduoSwitch = new PseduoSwitch(SmartHub.config.pseduo);
	pseduoSwitch.subscribe();
	return pseduoSwitch;
};


module.exports = PseduoSwitch;
