const pool = require('./mysql.js');

class NotificationModule {

	constructor() {
		this.config = SmartHub.config.notifications;
		this.mqttClient = SmartHub.mqttClient;
	}

	clearSilence(condition) {
		condition.suppress = false;
		console.log("Unsilencing " + condition.message);
	}

	silence(topic, hash) {
		this.config.conditions[topic].forEach((condition) => {
			if ( condition.hash == hash){
				condition.suppress = true;
				console.log("Silencing " + condition.message);
				setTimeout(this.clearSilence, 24 * 60 * 60 * 1000, condition);
			}
		})
	}

	processMessage(topic, condition, msg) {
		let message = JSON.parse(msg);
		let expressionResult = eval(condition.expression);
		if (expressionResult) {
			pool.query('INSERT INTO notification (message, suppressed) values( ?, ?)', [condition.message, condition.suppress], (error, results, fields) => {
				if (error) {
					console.log(error);
				}
			});

			if (!condition.suppress) {

				condition.hash = Buffer.from(condition.message).toString('base64');

				if (condition.mqtt)
					this.mqttClient.publish(condition.mqtt.topic, condition.message);

				if (condition.sms) {
					let smsMessage = condition.message + "\n\n\nTo silence for 24 hours\nhttp://petrocik.net:2157/api/notification/silence/" + topic + "?hash=" + condition.hash;
					condition.sms.forEach((phoneNumber) => {
						SmartHub.emit('SmsModule.SEND', phoneNumber, smsMessage);
					});
				}
			}
		}
	}

	subscribe() {
		let mqttClient = this.mqttClient;
		Object.keys(this.config.conditions).forEach(function(key) {
			console.log("Setting up notification on " + key);
			mqttClient.subscribe(key);
		});

		mqttClient.on('message',this.onMessage.bind(this));
	}

	onMessage(topic, message) {
		if (this.config.conditions[topic]) {
			console.log("Notification message recieved on " + topic);
			this.config.conditions[topic].forEach((condition) => {
				this.processMessage(topic, condition, message.toString());
			})
		}
	}

};

NotificationModule.init = function(){
	let notificationModule = new NotificationModule();
	notificationModule.subscribe();
	return notificationModule;
};


module.exports = NotificationModule;
