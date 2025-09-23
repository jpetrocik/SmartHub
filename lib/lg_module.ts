/**
 * Listening to a wildcard topic, anything after the topic is the command to control the TV
 *
 * e.g. house/livingroom/tv/system/turnOn
 * 
 * sends system/turnOn
 **/
import wol from 'wol'
import LGTV from 'lgtv2';

/**
 * Listening to a wildcard topic, anything after the topic is the command to control the TV
 *
 * e.g. house/livingroom/tv/system/turnOn
 * 
 * sends system/turnOn
 **/
export class LgWebOSModule {

	config: any;
	lgtv!: LGTV;
	connected = false;
	reties: 0;

	constructor(config: any) {
		this.config = config;
	}

	connect() {
		this.lgtv = LGTV({
			url: `ws://${this.config.address}:3000`,
			timeout: 30000,
			reconnect: 5000,
		});

		return new Promise((resolve, reject) => {

			this.lgtv.on('error', (err: Error) => {
				console.log('Connecting to TV failed!');
			});

			this.lgtv.on('connecting', () => {
				this.reties++;
				if (this.reties > 4) {
					console.log("Max connection attempts exceeded, discounting");
					this.lgtv.disconnect();
					this.lgtv = undefined;
				}
				console.log('Connecting to TV...');
			});

			this.lgtv.on('connect', () => {
				console.log('Successfully connected!');
				this.connected = true;
				this.reties = 0;
				resolve(true);
			});

			this.lgtv.on('prompt', () => {
				console.log('Please authorize on TV');
			});

			this.lgtv.on('close', () => {
				this.connected = false;
				console.log('Connection to TV lost');
			});
		});
	}

	async sendCommand(command: string, message: any, powerOn: boolean = false) {
		console.log("Sending " + command);

		if (powerOn && !this.lgtv) {
			await this.powerOn();
		}

		if (!this.lgtv && !this.connected) {
			console.log("Ignoring request, TV is not ready.");
			return;
		}
		return new Promise((resolve, reject) => {
			this.lgtv.request("ssap://" + command, JSON.stringify(message), (err: Error | null, res: any) => {
				if (err) {
					reject(err);
					return;
				}

				resolve(res);
			});
		});
	}

	async powerOn() {
		if (this.lgtv) {
			console.log("TV already on");
			return;
		}

		console.log("Sending WOL to " + this.config.macAddress);
		return new Promise((resolve, reject) => {
			wol.wake(this.config.macAddress, {}, async (err: any, res: any) => {
				if (err) {
					reject(err);
					return
				}

				try {
					await this.connect();
					console.log("TV ready...")
					resolve(true);
				} catch (error: any) {
					reject(err);
				}
			});
		});
	}

	async powerOff() {
		await this.sendCommand("system/turnOff", {}, true);
		this.lgtv.disconnect();
		this.lgtv = undefined;
	}

	volumeUp() {
		return this.sendCommand("audio/volumeUp", {});
	}

	volumeDown() {
		return this.sendCommand("audio/volumeDown", {});
	}

	volume(level: any) {
		return this.sendCommand("audio/setVolume", { volume: level });
	}

	channel(channelNum: any) {
		return this.sendCommand("tv/openChannel", { channelNumber: channelNum }, true);
	}

	/**
	 * com.webos.app.hdmi1
	 * com.webos.app.livetv
	 **/
	input(input: any) {
		return this.sendCommand("system.launcher/launch", { id: input }, true);
	}

	subscribe() {
		console.log("Subscribing to " + this.config.topic);
		global.SmartHub.mqttClient.subscribe(this.config.topic + "/#");
		global.SmartHub.mqttClient.on('message', this.onMessage.bind(this));
	}

	onMessage(topic: any, message: any) {
		if (topic.startsWith(this.config.topic)) {
			console.log("Message recieved on " + topic);
			var command = topic.replace(this.config.topic + "/", "");
			this.sendCommand(command, JSON.parse(message));
		}
	}

	static init() {
		let lgWebOSModule = new LgWebOSModule(global.SmartHub.config.lg);
		lgWebOSModule.subscribe();
		return lgWebOSModule;
	}
}
