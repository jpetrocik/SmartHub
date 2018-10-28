const request = require('request');
const debug = require('debug')('sunset-sunrise');

const when = 'today';

let lat;
let lon;

let refreshDelay = 12*60*60*1000;

let SunsetModule = {};

function requestSunset(SmartHub) {
    return new Promise(function(resolve, reject) {

		request('https://api.sunrise-sunset.org/json?lat=' + lat + '&lng=' + lon + '&date=' + when + '&formatted=0', { json: true }, (err, res, body) => {
			if (err) { 
				console.log(err);
				resolve();
			}

			debug(body);

			let sunset =  new Date(body.results.sunset);

			let sunrise = new Date(body.results.sunrise);

			let now = new Date();

			if ( sunrise > SunsetModule.SUNRISE_TIME) {
				SunsetModule.SUNRISE_TIME = sunrise;
				console.log("Sunrise  " + when + " at " + SunsetModule.SUNRISE_TIME);

				let sunriseTriggerDelay = sunrise.getTime() - now.getTime();
				if (sunriseTriggerDelay > 0) {
					console.log("Setting sunrise event in " + sunriseTriggerDelay);
					setTimeout(() => {SmartHub.emit('SunsetModule.SUNRISE')}, refreshDelay);
				}
			}

			if ( sunset > SunsetModule.SUNSET_TIME) {
				SunsetModule.SUNSET_TIME = sunset;
				console.log("Sunset " + when + " at " + SunsetModule.SUNSET_TIME);

				let sunsetTriggerDelay = sunset.getTime() - now.getTime();
				if (sunsetTriggerDelay > 0) {
					console.log("Setting sunset event in " + sunsetTriggerDelay);
					setTimeout(() => {SmartHub.emit('SunsetModule.SUNSET')}, refreshDelay);
				}
			}

			setTimeout(requestSunset, refreshDelay);

			resolve();
		});

	});
};

SunsetModule.init = async function(SmartHub){
	lat = SmartHub.config.sunset.lat;
	lon = SmartHub.config.sunset.lon;	
	await requestSunset(SmartHub);

	return this;
};



SunsetModule.SUNSET_TIME = 0;
SunsetModule.SUNRISE_TIME = 0;


module.exports = SunsetModule;




