const request = require('request');
const debug = require('debug')('sunset-sunrise');

const when = 'today';

let lat;
let lon;

let refreshDelay = 12*60*60*1000;

let SunsetModule = {};

function generateTrigger(sunrise, SUNRISE_TYPE) {
	if ( sunrise > SunsetModule[SUNRISE_TYPE]) {
		let now = new Date();
		SunsetModule[SUNRISE_TYPE] = sunrise;
		console.log(SUNRISE_TYPE + " at " + SunsetModule[SUNRISE_TYPE]);

		let triggerDelay = sunrise.getTime() - now.getTime();
		if (triggerDelay > 0) {
			setTimeout(() => {
				console.log("Firing " + SUNRISE_TYPE + " event");
				SmartHub.emit('SunsetModule.' + SUNRISE_TYPE)
			}, triggerDelay);
		}
	}
}
function requestSunset() {
    return new Promise(function(resolve, reject) {

		request('http://api.sunrise-sunset.org/json?lat=' + lat + '&lng=' + lon + '&date=' + when + '&formatted=0', { json: true }, (err, res, body) => {
			if (err) { 
				console.log(err);
				resolve();
				return;
			}

			debug(body);

			generateTrigger(new Date(body.results.sunrise), "SUNRISE_TIME");
			generateTrigger(new Date(body.results.sunset), "SUNSET_TIME");
			generateTrigger(new Date(body.results.civil_twilight_end), "CIVIL_SUNSET_TIME");
			generateTrigger(new Date(body.results.nautical_twilight_end), "NAUTICAL_SUNSET_TIME");
			generateTrigger(new Date(body.results.astronomical_twilight_end), "ASTRONOMCIAL_SUNSET_TIME");


			setTimeout(() => {requestSunset()}, refreshDelay);

			resolve();
		});

	});
};

SunsetModule.init = async function(){
	if (!SmartHub.config.sunset) {
		console.log("No sunset configuration found");
		return;
	}
	lat = SmartHub.config.sunset.lat;
	lon = SmartHub.config.sunset.lon;	
	await requestSunset();
};



SunsetModule.SUNSET_TIME = 0;
SunsetModule.SUNRISE_TIME = 0;
SunsetModule.CIVIL_SUNSET_TIME = 0;
SunsetModule.NAUTICAL_SUNSET_TIME = 0;
SunsetModule.ASTRONOMCIAL_SUNSET_TIME = 0;

module.exports = SunsetModule;




