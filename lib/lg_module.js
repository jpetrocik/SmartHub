let wol = require('node-wol');

let lgtv = null;
let connected = false;

function connect(executeOnConnect) {
	lgtv = require('lgtv2')({
    	url: 'ws://lgwebostv:3000',
    	timeout: 5000,
    	reconnect: 0
	});

	lgtv.on('error', function (err) {
		// connected = false;
		console.log("Error");
	});

	lgtv.on('connecting', function () {
	    console.log('Connecting to TV...');
	});

	lgtv.on('connect', function () {
	    console.log('Successfully connected!');
		connected = true;

	    if (executeOnConnect)
	    	executeOnConnect();
	});


	lgtv.on('prompt', function () {
	    console.log('Please authorize on TV');
	});

	lgtv.on('close', function () {
		connected = false;
	    console.log('Connection to TV lost');
	});
}

class LgWebOSModule {

	constructor(config, mqttClient) {
		this.config = config;
		this.mqttClient = mqttClient;


	}

	processCommand(command, message) {

		//special case to turnOn TV
		if (command === 'system/turnOn') {
			console.log(this.config.macAddress);
			wol.wake(this.config.macAddress, {}, () => {setTimeout(connect, 3000);});
		} else {
			let commandToExecute = function() {
				lgtv.request("ssap://" + command, message.toString(), function (err, res) {
					if (err) {
						console.log(err);
					}
				     console.log(res);
				});
			}
			if (connected == true) {
				commandToExecute();
			} else {
				connect(commandToExecute);
			}
		}

	}

	subscribe() {
		console.log("Subscribing to " + this.config.topic);
		this.mqttClient.subscribe(this.config.topic + "/#");
		this.mqttClient.on('message',this.onMessage.bind(this));
	}

	onMessage(topic, message) {
		console.log(topic);
		console.log(this.config.topic);
		if (topic.startsWith(this.config.topic)) {
			console.log("Message recieved on " + topic);
			var command = topic.replace(this.config.topic + "/","");
			this.processCommand(command, message);
		}
	}
};

LgWebOSModule.init = function(SmartHub){
	let lgWebOSModule = new LgWebOSModule(SmartHub.config.lg, SmartHub.mqttClient);
	lgWebOSModule.subscribe();
	return lgWebOSModule;
};

module.exports = LgWebOSModule;
