import config from '../config.json';
import mysql from 'mysql';
import mqtt from 'mqtt';
import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import EventEmitter from 'events';
import SunsetModule from './sunset_module.js';
import PseudoModule from './pseudo_module.js';
import ScheduleModule from './schedule_module.js';
import NotificationModule from './notification_module.js';
import { LgWebOSModule } from './lg_module.js';
import { OnkyoModule } from './onkyo_module.js';
import MythTvModule from './mythtv_module.js';
import PirModule from './pir_module.js';
import PlivoModule from './plivo_module.js';
import FirebaseModule from './firebase_module.js';
import MacModule from './mac_module.js';
import TPLinkModule from './tplink_module.js';
import { BridgeTopicModule } from './bridge_topic_module';


class SmartHub {
	events = new EventEmitter();
	config!: any;
	mqttClient!: any;
	express!: any;
	database!: any;
	modules: Array<any> = [];

	async init() {
		this.config = config;
		this.database = this.connectToDatabase();
		this.mqttClient = await this.connectToMqtt();
		this.express = await this.startExpress();

		await SunsetModule.init();
		ScheduleModule.init();
		PseudoModule.init();
		NotificationModule.init();
		LgWebOSModule.init();
		OnkyoModule.init();
		MythTvModule.init();
		PirModule.init();
		PlivoModule.init();
		FirebaseModule.init();
		MacModule.init();
		TPLinkModule.init();
		BridgeTopicModule.init();
	}

	connectToDatabase() {
		console.log('Creating mysql connection pool to ' + config.database.host)
		return mysql.createPool(config.database);
	};

	connectToMqtt() {
		let mqttServerUrl = this.config.mqtt.serverUrl;

		let mqttOptions;
		// if (mqttServerUrl.indexOf('mqtts') > -1) {
		// 	mqttOptions = {
		// 		key: fs.readFileSync(path.join(__dirname, 'mqttclient', '/client.key')),
		// 		cert: fs.readFileSync(path.join(__dirname, 'mqttclient', '/client.cert')),
		// 		ca: fs.readFileSync(path.join(__dirname, 'mqttclient', '/ca.cert')),
		// 		checkServerIdentity: function () { return undefined }
		// 	}
		// }

		console.log('Connecting to mqtt server ' + mqttServerUrl + '...');
		let mqttClient = mqtt.connect(mqttServerUrl, mqttOptions);

		return new Promise(function (resolve, reject) {
			mqttClient.on('connect', function () {
				console.log('Connected to mqtt server ' + mqttServerUrl);
				resolve(mqttClient);
			});
		})
	}

	startExpress() {
		let app = express();
		app.use(bodyParser.urlencoded({ extended: true }));
		app.use(bodyParser.json());
		app.use(cookieParser());

		return new Promise((resolve, reject) => {
			app.listen(2157, (err: Error) => {
				if (err) {
					reject(err);
					return;
				}

				console.log('Webserver listening on port 2157!');
				resolve(app);
			});
		});
	}

	on(eventName, listner) {
		this.events.on(eventName, listner);
	}

	emit(type, ...args) {
		this.events.emit(type, ...args);
	}
};

declare namespace NodeJS {
	interface Global {
		// Add your new global variable's type here.
		// In this example, we're adding a variable named 'appConfig'.
		SmartHub: any;
	}
}

global.SmartHub = new SmartHub();
global.SmartHub.init().then(() => { console.log('SmartHub initialization completed.') });



