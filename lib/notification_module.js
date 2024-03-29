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

	silence(hash) {
		let notification = Object.entries(this.config.topics).map(k => k[1]).flat().find(v => v.hash == hash);
		if (!notification)
			return;

		notification.suppress = true;
		console.log("Silencing " + notification.message);
		setTimeout(this.clearSilence, 24 * 60 * 60 * 1000, notification);
	}

	processMessage(notification, msg) {
		let message = JSON.parse(msg);
		let expressionResult = eval(notification.expression??"true");
		if (!expressionResult) 
			return;

		pool.query('INSERT INTO notification (message, suppressed) values( ?, ?)', [notification.message, notification.suppress], (error, results, fields) => {
			if (error) {
				console.log(error);
			}
		});

		if (notification.suppress) {
			console.log("Notification \"" + notification.message + "\" silenced");
			return;
		}

		notification.hash = Buffer.from(notification.message).toString('base64');

		console.log("Sending notification \"" + notification.message + "\"");
		SmartHub.emit('Notification.SEND', notification.message, notification.hash);

	}

	subscribe() {
		let mqttClient = this.mqttClient;
		Object.keys(this.config.topics).forEach(function(key) {
			console.log("Setting up notification on " + key);
			mqttClient.subscribe(key);
		});

		mqttClient.on('message',this.onMessage.bind(this));
	}

	onMessage(topic, message) {
		if (this.config.topics[topic]) {
			this.config.topics[topic].forEach((notification) => {
				this.processMessage(notification, message.toString());
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
