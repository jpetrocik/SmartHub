var mqtt = require('mqtt');
var devices = require('./devices.json');
var config = require('./config.json');

var mqttServerUrl = config.mqttServerUrl;

var processCommand = function(device, command) {
	if (command == 3) {
		console.log('Sending status ' + device.status);
		mqttClient.publish(device.status,'{"status":"OFF"}');
	} else if (command == 1) {
		Object.keys(device.messages).forEach(function(key) {
			console.log('Sending command ' + key + ' ' + device.messages[key]);
			mqttClient.publish(key,device.messages[key]);
		});
		mqttClient.publish(device.status,'{"status":"ON"}');
	} else if (command == 0) {
		Object.keys(device.messages).forEach(function(key) {
			console.log('Sending command ' + key + ' 0');
			mqttClient.publish(key,"0");
		});
		mqttClient.publish(device.status,'{"status":"OFF"}');
	}
};

// setup mqtt
var mqttOptions;
if (mqttServerUrl.indexOf('mqtts') > -1) {
	mqttOptions = { key: fs.readFileSync(path.join(__dirname, 'mqttclient', '/client.key')),
		cert: fs.readFileSync(path.join(__dirname, 'mqttclient', '/client.cert')),
		ca: fs.readFileSync(path.join(__dirname, 'mqttclient', '/ca.cert')),
		checkServerIdentity: function() { return undefined }
	}
}

console.log("Connecting to " + mqttServerUrl);
var mqttClient = mqtt.connect(mqttServerUrl, mqttOptions);
mqttClient.on('connect', function() {
		console.log("Connected to " + mqttServerUrl);
		Object.keys(devices).forEach(function(key) {
			console.log("Subscribing to " + key);
			mqttClient.subscribe(key);
		});
	});

mqttClient.on('message', function(topic, message) {
	console.log("Message recieved on " + topic);
		var command = message.toString();
		processCommand(devices[topic], command);
	});
