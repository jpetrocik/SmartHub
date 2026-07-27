const express = require('express');

class NotificationModule {

	constructor() {
		this.config = SmartHub.config.notifications;
	}

	clearSilence(condition) {
		condition.suppress = false;
		console.log("Unsilencing " + condition.message);
	}

	silence(hash) {
		let notification = Object.entries(this.config.topics).map(k => k[1]).flat().find(v => v.hash == hash);
		if (!notification)
			return;

		if (!notification.message) {
			console.log("Cannot silence notification with no message");
			return;
		}
		
		notification.suppress = true;
		console.log("Silencing " + notification.message);
		setTimeout(this.clearSilence, 24 * 60 * 60 * 1000, notification);
	}

	processMessage(notification, message) {
		notification.format ??= 'json';

		if (String(notification.format).toLowerCase() === 'json') {
			try {
				message = JSON.parse(message);
			} catch (e) {
				console.log("Failed to parse message as JSON");
				return;
			}
		}

		try {
			let expressionResult = eval(notification.expression ?? "true");
			if (!expressionResult)
				return;
		}
		catch (e) {
			console.log("Failed to evaluate expression: " + e);
			return;
		}
		
		const notificationMessage = notification.message ?? message;

		SmartHub.database.query('INSERT INTO notification (message, suppressed) values( ?, ?)', [notificationMessage, notification.suppress], (error, results, fields) => {
			if (error) {
				console.log(error);
			}
		});

		if (notification.suppress) {
			console.log("Notification \"" + notificationMessage + "\" silenced");
			return;
		}


		notification.hash = Buffer.from(notificationMessage).toString('base64');

		console.log("Sending notification \"" + notificationMessage + "\"");
		SmartHub.emit('Notification.SEND', notificationMessage, notification.hash);

	}

	subscribe() {
		Object.keys(this.config.topics).forEach(function (key) {
			console.log("Setting up notification on " + key);
			SmartHub.mqttClient.subscribe(key);
		});

		SmartHub.mqttClient.on('message', this.onMessage.bind(this));
	}

	onMessage(topic, message, packet) {
		if (packet.retain) {
			console.log("Ignoring retained message on " + topic);
			return;
		}
		
		if (this.config.topics[topic]) {
			this.config.topics[topic].forEach((notification) => {
				this.processMessage(notification, message.toString());
			})
		}
	}

	registerApis() {
		let router = express.Router();

		console.log("Registering /notification/silence")
		router.get("/silence/*", (req, res) => {
			this.silence(req.query.hash);
			res.sendStatus(200);
		});

		SmartHub.express.use('/api/notification', router);
	}

};

NotificationModule.init = function () {
	if (!SmartHub.config.notifications) {
		console.log("No notification configuration found");
		return;
	}
	let notificationModule = new NotificationModule();
	notificationModule.subscribe();
	notificationModule.registerApis();

	SmartHub.modules["notificationModule"] = notificationModule;
};

module.exports = NotificationModule;
