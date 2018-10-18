const config = require('./config.json');
const MqttModule = require('./mqtt_module.js');
const SunsetModule = require('./sunset_module.js');
const PseudoModule = require('./pseudo_module.js');
const X10Module = require('./x10_module.js');
const ScheduleModule = require('./schedule_module.js');

let SmartHub = {};
SmartHub.config = config;

SmartHub.initModules = async function () {
	SmartHub.mqttClient = await MqttModule.init(SmartHub);
	SmartHub.sunsetModule = await SunsetModule.init(SmartHub);
	SmartHub.scheduleModule = ScheduleModule.init(SmartHub);
	SmartHub.pseudoModule = await PseudoModule.init(SmartHub);
	SmartHub.x10Module = await X10Module.init(SmartHub);
};

SmartHub.initModules();
