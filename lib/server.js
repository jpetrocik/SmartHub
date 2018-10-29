const config = require('./config.json');

const EventEmitter = require('events');
const MqttModule = require('./mqtt_module.js');
const SunsetModule = require('./sunset_module.js');
const PseudoModule = require('./pseudo_module.js');
const X10Module = require('./x10_module.js');
const ScheduleModule = require('./schedule_module.js');
const NotificationModule = require('./notification_module.js');



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
	SmartHub.x10Module = await X10Module.init(SmartHub);
	SmartHub.notificationModule = await NotificationModule.init(SmartHub);
};

SmartHub.initModules();

