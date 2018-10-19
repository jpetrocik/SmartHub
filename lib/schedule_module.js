var CronJob = require('cron').CronJob;
const debug = require('debug')('schedule');

var VARIABLE_MATCHER = new RegExp('__(.+)__');

class ScheduleModule {
	constructor(mqttClient){
		this.mqttClient = mqttClient;
	}

	createRecursiveJob(key, config, SmartHub) {
		console.log("Adding schedule for " + key + " with schedule of " + config[key].cron);
			let results = VARIABLE_MATCHER.exec(config[key].cron);
			let date = eval("SmartHub."+results[1]);
			let mqttClient = this.mqttClient;
			let that = this;

			let newJob = new CronJob(date, function() {
				console.log("Firing " + key + " schedule");
				mqttClient.publish(config[key].topic,config[key].message);
				that.createRecursiveJob(key, config, SmartHub);
			});

			newJob.start();
	
	}
	addSchedules(config, SmartHub) {
		Object.keys(config).forEach(function(key) {
			if (VARIABLE_MATCHER.test(config[key].cron)) {
				this.createRecursiveJob(key, config, SmartHub);
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

ScheduleModule.init = async function(SmartHub){
	let schedules = new ScheduleModule(SmartHub.mqttClient);
	schedules.addSchedules(SmartHub.config.schedules, SmartHub);

	return schedules;
};




module.exports = ScheduleModule;




