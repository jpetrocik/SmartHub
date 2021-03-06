var CronJob = require('cron').CronJob;
const debug = require('debug')('schedule');

var EVENT_MATCHER = new RegExp('__(.+)__');

class ScheduleModule {
	constructor(mqttClient){
		this.mqttClient = mqttClient;
	}

	createEventBaseJob(key, config) {
		console.log("Adding schedule for " + key + " on event " + config[key].cron);
			let eventName = EVENT_MATCHER.exec(config[key].cron);

			let mqttClient = this.mqttClient;
			SmartHub.on(eventName[1], () => {
				console.log("Firing " + key + " event");
				mqttClient.publish(config[key].topic,config[key].message);
			});


	
	}
	addSchedules(config) {
		Object.keys(config).forEach(function(key) {
			if (config[key].enabled != undefined && !config[key].enabled)
                               return;
			if (EVENT_MATCHER.test(config[key].cron)) {
				this.createEventBaseJob(key, config);
			} else {
				console.log("Adding schedule for " + key + " with schedule of " + config[key].cron);
				let mqttClient = this.mqttClient;
				let newJob = new CronJob(config[key].cron, function() {
					console.log("Firing " + key + " schedule");
					mqttClient.publish(config[key].topic,config[key].message);
				}, null, true, 'America/Los_Angeles');
				newJob.start();
			}
		}, this);

	
	}
}

ScheduleModule.init = async function(){
	let schedules = new ScheduleModule(SmartHub.mqttClient);
	schedules.addSchedules(SmartHub.config.schedules);

	return schedules;
};




module.exports = ScheduleModule;




