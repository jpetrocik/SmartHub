var CronJob = require('cron').CronJob;
const debug = require('debug')('schedule');

var EVENT_MATCHER = new RegExp('__(.+)__');

class ScheduleModule {
	constructor() {
	}

	createEventBaseJob(key, config) {
		console.log("Adding schedule for " + key + " on event " + config[key].cron);
		let eventName = EVENT_MATCHER.exec(config[key].cron);

		SmartHub.on(eventName[1], () => {
			console.log("Firing " + key + " event");
			SmartHub.mqttClient.publish(config[key].topic, config[key].message);
		});



	}
	addSchedules(config) {
		Object.keys(config).forEach(function (key) {
			if (config[key].enabled != undefined && !config[key].enabled)
				return;
			if (EVENT_MATCHER.test(config[key].cron)) {
				this.createEventBaseJob(key, config);
			} else {
				console.log("Adding schedule for " + key + " with schedule of " + config[key].cron);
				let newJob = new CronJob(config[key].cron, function () {
					console.log("Firing " + key + " schedule");
					SmartHub.mqttClient.publish(config[key].topic, config[key].message);
				}, null, true, 'America/Los_Angeles');
				newJob.start();
			}
		}, this);


	}
}

ScheduleModule.init = async function () {
	if(!SmartHub.config.schedules) {
		console.log("No schedules configuration found");
		return;
	}
	let schedules = new ScheduleModule();
	schedules.addSchedules(SmartHub.config.schedules);

	return schedules;
};




module.exports = ScheduleModule;




