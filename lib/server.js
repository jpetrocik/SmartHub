const config = require('./config.json');

const EventEmitter = require('events');
const MqttModule = require('./mqtt_module.js');
const SunsetModule = require('./sunset_module.js');
const PseudoModule = require('./pseudo_module.js');
//const X10Module = require('./x10_module.js');
const ScheduleModule = require('./schedule_module.js');
const NotificationModule = require('./notification_module.js');
const LgWebOSModule = require('./lg_module.js');
const OnkyoModule = require('./onkyo_module.js');
const MythTvModule = require('./mythtv_module.js');
const HttpModule = require('./http_module.js');
const PirModule = require('./pir_module.js');
const PlivoModule = require('./plivo_module.js');

let events = new EventEmitter();

let SmartHub = {};
SmartHub.config = config;
SmartHub.on = function(eventName, listner) {
	events.on(eventName, listner);
}

SmartHub.emit = function(type, ...args) {
	events.emit(type, ...args);
}

SmartHub.initModules = async function () {
	SmartHub.mqttClient = await MqttModule.init(SmartHub);
	SmartHub.sunsetModule = await SunsetModule.init(SmartHub);
	SmartHub.scheduleModule = ScheduleModule.init(SmartHub);
	SmartHub.pseudoModule = await PseudoModule.init(SmartHub);
//	SmartHub.x10Module = await X10Module.init(SmartHub);
	SmartHub.notificationModule = await NotificationModule.init(SmartHub);
	SmartHub.lgTvModule = await LgWebOSModule.init(SmartHub);
	SmartHub.onkyoModule = await OnkyoModule.init(SmartHub);
	SmartHub.mythTvModule = await MythTvModule.init(SmartHub);
	SmartHub.pirModule = await PirModule.init(SmartHub);
	SmartHub.plivoModule = await PlivoModule.init(SmartHub);

	//must be last module
	SmartHub.httpModule = await HttpModule.init(SmartHub);
}

SmartHub.initModules();



