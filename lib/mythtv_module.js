var http = require('http');
const didYouMean = require('didyoumean2')

var frontendIp = "192.168.1.11",
	frontendPort = "6547";

class MythTvModule {
	constructor(config, mqttClient) {
		this.config = config;
		this.mqttClient = mqttClient;
	}


	sendRequest(method, url, port) {
		return new Promise((resolve, reject) => {
			let options = {
				host: frontendIp,
				port: port,
				path: url,
				method: method,
				headers: {
					Accept: 'application/json',
				}
			};

			console.log(url);

			let req = http.request(options, function(response) {
				let body = '';

				response.on('data', function(d) {
					body += d;
				});

				response.on('end', function() {
					if (response.statusCode == 200) {
						var results = JSON.parse(body);
						resolve(results);
					} else {
						reject(response.statusCode);
					}
				});
			});

			req.end();

		});
	}

	stop() {
		console.log("Stop Playback");
		return this.sendRequest("POST", "/Frontend/SendAction?Action=STOPPLAYBACK", 6547);
	}

	pause() {
		console.log("Pausing Playback");
		return this.sendRequest("POST", "/Frontend/SendAction?Action=PAUSE", 6547);
	}

	resume() {
		console.log("Resuming Playback");
		this.sendRequest("POST", "/Frontend/SendAction?Action=PLAY", 6547);
	}

	start(show) {
		return new Promise((resolve, reject) => {
			console.log("Searching for " + show);
			this.recordedListing().then( (showListings) => {
				var bestMatch = didYouMean(show.toLowerCase(), showListings.ProgramList.Programs, { matchPath: "Title"});
				if (bestMatch == null) {
					reject("No match for " + show + " found");
					return;
				}

				console.log("Starting " + bestMatch.Title);
				this.sendRequest("POST", "/Frontend/PlayRecording?ChanId=" + bestMatch.Channel.ChanId + "&StartTime=" + bestMatch.StartTime, 6547)
					.then((status) => { 
						resolve(bestMatch);
					});
			});
		});
	}

	play(chanId, startTime) {
		console.log("Playing " + chanId + " at " + startTime);
		return this.sendRequest("POST", "/Frontend/PlayRecording?ChanId=" + chanId + "&StartTime=" + startTime, 6547);
	}

	recordedListing() {
		console.log("Retrieving recorded shows");
		return this.sendRequest("GET", "/Dvr/GetRecordedList?StartIndex=1&Count=100&Descending=true", 6544);
	}

	subscribe() {
		console.log("Subscribing to " + this.config.topic);
		this.mqttClient.subscribe(this.config.topic + "/#");
		this.mqttClient.on('message',this.onMessage.bind(this));
	}

	onMessage(topic, message) {
		if (topic.startsWith(this.config.topic)) {
			console.log("Message recieved on " + topic);
			var command = topic.replace(this.config.topic + "/","");
			this.sendCommand(command, message);
		}
	}

}

MythTvModule.init = function(){
	let mythTvModule = new MythTvModule(SmartHub.config.onkyo, SmartHub.mqttClient);
	mythTvModule.subscribe();
	return mythTvModule;
};

module.exports = MythTvModule;