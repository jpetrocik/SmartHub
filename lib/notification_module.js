
var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'hermes.petrocik.net',
  user     : 'john',
  password : 'oropez',
  database : 'smarthub'
});
 
connection.connect();

class NotificationModule {

	constructor(config, mqttClient) {
		this.conditions = config.conditions;
		this.mqttClient = mqttClient;
	}

	processMessage(condition, msg) {
		let message = JSON.parse(msg);
		let expressionResult = eval(condition.expression);
		if (expressionResult) {
			connection.query('INSERT INTO notification (message) values( ? )', condition.message);
			if (!condition.surpress) {
				this.mqttClient.publish(condition.topic,condition.message);
			}
		}
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
			console.log("Notification message recieved on " + topic);
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
