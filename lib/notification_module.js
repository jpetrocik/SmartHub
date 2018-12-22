
class NotificationModule {

	constructor(config, mqttClient) {
		this.topic = config.topic;
		this.conditions = config.conditions;
		this.mqttClient = mqttClient;
	}

	processMessage(condition, message) {
		let expressionResult = eval(condition.expression);
		if (expressionResult)
			this.mqttClient.publish(this.topic,condition.message);
	}

	subscribe() {
		let mqttClient = this.mqttClient;
		Object.keys(this.conditions).forEach(function(key) {
			console.log("Setting up notification on " + key);
			mqttClient.subscribe(key);
		});

		mqttClient.on('message',this.onMessage.bind(this));
	}

	onMessage(topic, message) {
		if (this.conditions[topic]) {
			console.log("Message recieved on " + topic);
			this.processMessage(this.conditions[topic], message.toString());
		}
	}

};

NotificationModule.init = function(SmartHub){
	let notificationModule = new NotificationModule(SmartHub.config.notifications, SmartHub.mqttClient);
	notificationModule.subscribe();
	return notificationModule;
};


module.exports = NotificationModule;