/**
 * Listening to a wildcard topic, anything after the topic is the command to control the TV
 *
 * e.g. house/livingroom/tv/system/turnOn
 * 
 * sends system/turnOn
 **/
import { LGTV, Inputs, DefaultSettings } from 'lgtv-ip-control';
import express from 'express';

/**
 * Listening to a wildcard topic, anything after the topic is the command to control the TV
 *
 * e.g. house/livingroom/tv/system/turnOn
 * 
 * sends system/turnOn
 **/
export class LgWebOSModule {


	static readonly INPUT_LIVETV = "dtv";
	static readonly INPUT_HDMI1 = "hdmi1";
	static readonly INPUT_HDMI2 = "hdmi2";

	config: LGConfig;
	lgtv!: LGTV;

	constructor(config: LGConfig) {
		this.config = config;

		console.log("Subscribing to " + this.config.topic);
		global.SmartHub.mqttClient.subscribe(this.config.topic + "/#");
		global.SmartHub.mqttClient.on('message', this.onMessage.bind(this));

		DefaultSettings.networkWolAddress = "192.168.1.255";
		DefaultSettings.networkTimeout = 1000;

		this.lgtv = new LGTV(
			this.config.address,
			this.config.macAddress,
			this.config.key,
			DefaultSettings
		);
	}

	async connect() {
		let retries = 0;
		try {
			await this.lgtv.connect();
			retries = 0;
			console.log('Successfully connected!');
			return true;
		} catch (err) {
			retries++;
			if (retries > 4) {
				console.log("Max connection attempts exceeded, disconnecting");
				this.lgtv.disconnect();
				retries = 0;
				return false;
			}
			console.log('Connecting to TV failed!');
			throw err;
		}
	}

	private async sendCommand(command: any, powerOn: boolean = false) {
		if (powerOn && !this.lgtv.connected) {
			await this.powerOnAndConnect();
		} else if (!this.lgtv.connected) {
			await this.connect();
		}

		if (!this.lgtv.connected) {
			console.log("Ignoring request, TV is not ready.");
			return;
		}

		try {
			await command();
		} catch (err) {
			console.log("Error sending command: " + err);
		}
	}

	async powerOnAndConnect() {
		await this.lgtv.powerOn();
		await this.lgtv.connect({ maxRetries: 25, retryTimeout: 5000 });
	}

	async powerOff() {
		await this.lgtv.disconnect();
		await this.lgtv.powerOff();
	}

	async volumeUp() {
		await this.sendCommand(async () => {
			let currentVolume = await this.lgtv.getCurrentVolume() + 1;
			await this.lgtv.setVolume();
		});
	}

	async volumeDown() {
		await this.sendCommand(async () => {
			let currentVolume = await this.lgtv.getCurrentVolume() - 1;
			await this.lgtv.setVolume(currentVolume);
		});
	}

	async volume(level: any) {
		await this.sendCommand(async () => {
			await this.lgtv.setVolume(level);
		});
	}

	async channel(channelNum: any) {
		await this.sendCommand(async () => {
			await this.lgtv.setDigitalChannel(channelNum);
		}, true);
	}

	async input(input: any) {
		if (Inputs[input]) {
			await this.sendCommand(async () => {
				await this.lgtv.setInput(Inputs[input]);
			}, true);
		} else {
			console.log("Unknown input: " + input);
		}
	}

	//{topic_prefix}/audio/setVolume with payload { "volume": 15 }
	onMessage(topic: any, payload: any) {
		if (topic.startsWith(this.config.topic)) {
			console.log("Message received on " + topic);
			const command = topic.replace(this.config.topic + "/", "");

			const message = payload.toString();
			switch (command) {
				case "audio/volumeUp":
					return this.volumeUp();
				case "audio/volumeDown":
					return this.volumeDown();
				case "audio/setVolume":
					return this.volume(message);
				case "system/turnOff":
					return this.lgtv.powerOff();
				case "tv/openChannel":
					return this.channel(message);
				case "system.launcher/launch":
					return this.input(Inputs[message]);
				default:
					console.log("Unknown command: " + command);
					return;
			}
		}
	}

	static registerApis() {
		let router = express.Router();

		console.log("Registering /watchTV")
		router.post("/watchTV/:id", async (req, res) => {

			let chanNum = req.query.chanNum;

			try {
				//Switch TV input to LiveTV
				await global.SmartHub.modules[req.params.id].input(LgWebOSModule.INPUT_LIVETV);

				//Change change
				await global.SmartHub.modules[req.params.id].channel(chanNum);

				console.log("watchTV completed");
				res.sendStatus(200);
			} catch (err) {
				console.log(err);

				res.sendStatus(500);
			}
		});

		global.SmartHub.express.use('/api', router);
	}

	static init() {
		if (!global.SmartHub.config.lg || (global.SmartHub.config.lg as LGConfig[]).length === 0) {
			console.log("No LG TV configuration found");
			return;
		}

		(global.SmartHub.config.lg as LGConfig[]).forEach((config) => {
			global.SmartHub.modules[config.id] = new LgWebOSModule(config);
		});

		LgWebOSModule.registerApis();
	}
}

interface LGConfig {
	id: string;
	topic: string;
	address: string;
	macAddress: string;
	key: string; // lgtv-ip-control pairing key
}
