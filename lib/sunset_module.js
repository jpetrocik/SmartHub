const request = require('request');
const debug = require('debug')('sunset-sunrise');

let lat;
let lon;

let SunsetModule = {};

SunsetModule.init = function(SmartHub){
	lat = SmartHub.config.sunset.lat;
	lon = SmartHub.config.sunset.lon;	
	SunsetModule.requestSunset();

	return this;
};

SunsetModule.requestSunset = function() {
	request('https://api.sunrise-sunset.org/json?lat=' + lat + '&lng=' + lon + '&date=today&formatted=0', { json: true }, (err, res, body) => {
		if (err) { 
			return console.log(err);
		}

		debug(body);

		SunsetModule.SUNSET_TIME = body.results.sunset;

		console.log("Sunset at " + SunsetModule.SUNSET_TIME);
	});

	SunsetModule.setupTimer();

};

SunsetModule.setupTimer = function() {
	setTimeout(SunsetModule.requestSunset, 24 * 60 * 60 * 1000);
};

SunsetModule.SUNSET_TIME = 0;


module.exports = SunsetModule;




