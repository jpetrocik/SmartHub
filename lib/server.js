const config = require('../config.json');

SmartHub = {};

const EventEmitter = require('events');
const MqttModule = require('./mqtt_module.js');
const SunsetModule = require('./sunset_module.js');
const PseudoModule = require('./pseudo_module.js');
//const X10Module = require('./x10_module.js');
const ScheduleModule = require('./schedule_module.js');
const NotificationModule = require('./notification_module.js');
const LgWebOSModule = require('./lg_module.js');
// const OnkyoModule = require('./onkyo_module.js');
const MythTvModule = require('./mythtv_module.js');
const HttpModule = require('./http_module.js');
const PirModule = require('./pir_module.js');
const PlivoModule = require('./plivo_module.js');
const FirebaseModule = require('./firebase_module.js');
const MacModule = require('./mac_module.js');
const TPLinkModule = require('./tplink.js');

let events = new EventEmitter();

SmartHub.config = config;
SmartHub.on = function(eventName, listner) {
	events.on(eventName, listner);
}

SmartHub.emit = function(type, ...args) {
	events.emit(type, ...args);
}

SmartHub.initModules = async function () {
	SmartHub.mqttClient = await MqttModule.init();
	SmartHub.sunsetModule = await SunsetModule.init();
	SmartHub.scheduleModule = ScheduleModule.init();
	SmartHub.pseudoModule = await PseudoModule.init();
//	SmartHub.x10Module = await X10Module.init(SmartHub);
	SmartHub.notificationModule = await NotificationModule.init();
	SmartHub.lgTvModule = await LgWebOSModule.init();
	// SmartHub.onkyoModule = await OnkyoModule.init();
	SmartHub.mythTvModule = await MythTvModule.init();
	SmartHub.pirModule = await PirModule.init();
	SmartHub.plivoModule = await PlivoModule.init();
	SmartHub.FirebaseModule = await FirebaseModule.init();
	SmartHub.MacModule = await MacModule.init();
	SmartHub.TPLinkModule = await TPLinkModule.init();

	//must be last module
	SmartHub.httpModule = await HttpModule.init();
}

SmartHub.initModules();



