const mqtt = require('mqtt');


let MqttModule = {};

MqttModule.init = function(SmartHub) {
	let mqttServerUrl = SmartHub.config.mqttServerUrl;

	let mqttOptions;
	if (mqttServerUrl.indexOf('mqtts') > -1) {
		mqttOptions = { key: fs.readFileSync(path.join(__dirname, 'mqttclient', '/client.key')),
			cert: fs.readFileSync(path.join(__dirname, 'mqttclient', '/client.cert')),
			ca: fs.readFileSync(path.join(__dirname, 'mqttclient', '/ca.cert')),
			checkServerIdentity: function() { return undefined }
		}
	}

	console.log("Connecting to " + mqttServerUrl + "...");
	let mqttClient = mqtt.connect(mqttServerUrl, mqttOptions);

	mqttClient.on('message', function(topic, message) {
		console.log("Message recieved on " + topic);
			var command = message.toString();
			processCommand(devices[topic], command);
		});

    return new Promise(function(resolve, reject) {
    	mqttClient.on('connect', function() {
			console.log("Connected to " + mqttServerUrl);
            resolve(mqttClient);
		});
    })

}


module.exports = MqttModule;