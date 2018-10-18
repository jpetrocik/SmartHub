const request = require('request');
const debug = require('debug')('sunset-sunrise');

let lat;
let lon;

let refreshDelay = 24 * 60 * 60 * 1000;
//let refreshDelay = 5 * 1000;

let SunsetModule = {};

function requestSunset() {
    return new Promise(function(resolve, reject) {

		request('https://api.sunrise-sunset.org/json?lat=' + lat + '&lng=' + lon + '&date=today&formatted=0', { json: true }, (err, res, body) => {
			if (err) { 
				console.log(err);
				resolve();
			}

			debug(body);

			SunsetModule.SUNSET_TIME = new Date(body.results.sunset);

			console.log("Sunset at " + SunsetModule.SUNSET_TIME);

			setTimeout(requestSunset, refreshDelay);

			resolve();
		});

	});
};

SunsetModule.init = async function(SmartHub){
	lat = SmartHub.config.sunset.lat;
	lon = SmartHub.config.sunset.lon;	
	await requestSunset();

	return this;
};



SunsetModule.SUNSET_TIME = 0;


module.exports = SunsetModule;




