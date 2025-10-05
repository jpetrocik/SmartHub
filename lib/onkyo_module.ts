/*jslint node:true nomen:true*/
'use strict';

import { on } from 'events';

const util = require('util');
const eiscp = require('eiscp');

// eiscp.on('debug', util.log);
eiscp.on('error', util.log);

export enum PowerState { STANDBY, ON }

export enum InputSource { MYTHTV = "01", TV = "12" }

export class OnkyoModule {
	config: any;
	connected = false;
	powerState = PowerState.STANDBY;

	constructor(config) {
		this.config = config;
	}

	connect() {
		return new Promise((resolve, reject) => {
			console.log("eISCP Scanning....")

			// Discover receviers on network, stop after 2 receviers or 5 seconds
			eiscp.discover({ devices: this.config.length, timeout: 10 }, (err, result) => {

				if (err) {
					console.log("Error message: " + result);
				} else {
					console.log("Found " + result.model + " on the local network at " + result.host + ":" + result.port);
					if (result.model == this.config.model) {
						console.log("Connecting to " + result.model + " at " + result.host + ":" + result.port);
						eiscp.connect({ host: result.host, port: result.port, model: result.model });
					}
				}
			});

			eiscp.on('connect', (ipAddress, port, model) => {
				console.log("Connected to " + model)
				this.connected = true;
				this.sendCommand("PWR", "QSTN");
				resolve(true);
			});

			eiscp.on('close', (arg) => {
				this.connected = false;
			});

			eiscp.on('data', (data) => {
				if (data.command == "PWR") {
					if (data.data == "01") {
						this.powerState = PowerState.ON;
					} else {
						this.powerState = PowerState.STANDBY;
					}
				}
				console.log("Data recieved from reciever: " + JSON.stringify(data));
			});
		});
	}

	async sendCommand(command, data) {
		if (!this.connected) {
			await this.connect();
		}

		return new Promise((resolve, reject) => {
			console.log("Sending " + command);
			eiscp.command(command, data, () => {
				resolve(true);
			});
		});
	}

	powerOn() {
		return this.sendCommand("PWR", "01");
	}

	powerOff() {
		return this.sendCommand("PWR", "00");
	}

	volume(level) {
		return this.sendCommand("MVL", level);
	}

	input(selection) {
		return this.sendCommand("SLI", selection);
	}

	subscribe() {
		console.log("Subscribing to " + this.config.topic);
		global.SmartHub.mqttClient.subscribe(this.config.topic + "/#");
		global.SmartHub.mqttClient.on('message', this.onMessage.bind(this));
	}

	onMessage(topic, message) {
		if (topic.startsWith(this.config.topic)) {
			console.log("Message recieved on " + topic);
			var command = topic.replace(this.config.topic + "/", "");
			this.sendCommand(command, message);
		}
	}

	static init() {
		if (!global.SmartHub.config.onkyo) {
			console.log("No Onkyo configuration found");
			return;
		}


		(global.SmartHub.config.onkyo as OnkyoConfig[]).forEach(async (config) => {
			const onkyoModule = new OnkyoModule(config);
			onkyoModule.subscribe();

			global.SmartHub.modules[config.model] = onkyoModule
		});
	};
}

interface OnkyoConfig {
	model: string;
	topic: string;
}