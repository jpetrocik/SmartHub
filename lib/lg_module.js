/**
 * Listening to a wildcard topic, anything after the topic is the command to control the TV
 *
 * e.g. house/livingroom/tv/system/turnOn
 * 
 * sends system/turnOn
 **/
let wol = require('node-wol');

let lgtv = null;
let connected = false;

function connect() {
	return new Promise( (resolve, reject) => {
		lgtv = require('lgtv2')({
			url: 'ws://192.168.1.132:3000',
			timeout: 5000,
			reconnect: false
		});

		lgtv.on('error', function (err) {
		    console.log('Connecting to TV failed!');
			reject(err);
		});

		lgtv.on('connecting', function () {
		    console.log('Connecting to TV...');
		});

		lgtv.on('connect', function () {
		    console.log('Successfully connected!');
			connected = true;

		    resolve();
		});

		lgtv.on('prompt', function () {
		    console.log('Please authorize on TV');
		});

		lgtv.on('close', function () {
			connected = false;
		    console.log('Connection to TV lost');
		});
	});
}

class LgWebOSModule {

	constructor(config, mqttClient) {
		this.config = config;
		this.mqttClient = mqttClient;

	}

	/**
	 * Auto connects and/or powers on the TV it needed
	 **/
	sendCommand(command, message, disablePowerOn) {
		return new Promise((resolve, reject) => {
			let commandToExecute = function() {
				console.log("Sending " + command);
				lgtv.request("ssap://" + command, JSON.stringify(message), function (err, res) {
					if (err) {
						console.log(command + " failed...");
						console.log(err);
						reject(err);
						return;
					}
					setTimeout(() => { resolve(res); }, 500);
				});
			}

			if (connected == true) {
				commandToExecute();
			} else {
				connect()
					.then(commandToExecute)
					.catch( (e) => { 
						if (!disablePowerOn) {
							this.powerOn()
								.then(commandToExecute)
								.catch(() => {
									console.log("Unable to wake TV");
									reject();
								})
						}
					 });
			}
		});
	}

	powerOn() {
		return new Promise((resolve, reject) => {
			console.log("Sending WOL to " + this.config.macAddress);

			let executeAfterPowerOn = function() {
				connect().then(resolve).catch( (e) => {
					reject();
				});
			}

			wol.wake(this.config.macAddress, {}, (err) => {
				if (err) {
					reject();
					return
				}
				console.log("Waiting to wake");
				setTimeout(executeAfterPowerOn, 10000);
			});
		});
	}

	powerOff() {
		return this.sendCommand("system/turnOff", {}, true);
	}

	volumeUp() {
		return this.sendCommand("audio/volumeUp", {}, true);
	}

	volumeDown() {
		return this.sendCommand("audio/volumeDown", {}, true);
	}

	volume(level) {
		return this.sendCommand("audio/setVolume", {volume:level}, true);
	}

	channel(channelNum) {
		return this.sendCommand("tv/openChannel", { channelNumber: channelNum } );
	}

	/**
	 * com.webos.app.hdmi1
	 * com.webos.app.livetv
	 **/
	input(input){
		return this.sendCommand("system.launcher/launch", {id:input});
	}

	subscribe() {
		console.log("Subscribing to " + this.config.topic);
		this.mqttClient.subscribe(this.config.topic + "/#");
		this.mqttClient.on('message',this.onMessage.bind(this));
	}

	onMessage(topic, message) {
		if (topic.startsWith(this.config.topic)) {
			console.log("Message recieved on " + topic);
			var command = topic.replace(this.config.topic + "/","");
			this.sendCommand(command, JSON.parse(message));
		}
	}

};

LgWebOSModule.init = function(){
	let lgWebOSModule = new LgWebOSModule(SmartHub.config.lg, SmartHub.mqttClient);
	lgWebOSModule.subscribe();
	return lgWebOSModule;
};

module.exports = LgWebOSModule;
