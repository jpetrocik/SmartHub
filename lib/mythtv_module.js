const http = require('http');
const express = require('express');
const didYouMean = require('didyoumean2')

class MythTvModule {
	constructor(config) {
		this.config = config;
	}


	sendRequest(method, url, port) {
		return new Promise((resolve, reject) => {
			let options = {
				host: this.config.frontendIp,
				port: port,
				path: url,
				method: method,
				headers: {
					Accept: 'application/json',
				}
			};

			console.log(url);

			let req = http.request(options, function (response) {
				let body = '';

				response.on('data', function (d) {
					body += d;
				});

				response.on('end', function () {
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
			this.recordedListing().then((showListings) => {
				var bestMatch = didYouMean(show.toLowerCase(), showListings.ProgramList.Programs, { matchPath: "Title" });
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

	registerApis() {
		let router = express.Router();

		console.log("Registering /playRecording");
		router.post("/playRecording", async (req, res) => {

			let chanId = req.query.chanId;
			let startTime = req.query.startTime;

			try {
				//Switch TV input to HDMI1
				await SmartHub.lgTvModule.input("com.webos.app.hdmi2");

				//Play Recording
				await SmartHub.mythTvModule.play(chanId, startTime);

				//Switch Reciever input to MythTv
				await SmartHub.onkyoModule.input("01");

				console.log("playRecording completed");
				res.sendStatus(200);
			} catch (err) {
				res.sendStatus(500);

			}

		});

		console.log("Registering /watchTV")
		router.post("/watchTV", async (req, res) => {

			let chanNum = req.query.chanNum;

			try {
				//Switch TV input to LiveTV
				await SmartHub.lgTvModule.input("com.webos.app.livetv");

				//Change change
				await SmartHub.lgTvModule.channel(chanNum);

				//Switch Reciever input to TV
				await SmartHub.onkyoModule.input("12");

				console.log("watchTV completed");
				res.sendStatus(200);
			} catch (err) {
				res.sendStatus(500);
			}
		});

		SmartHub.express.use('/api', router);

	}
}


MythTvModule.init = function () {
	let mythTvModule = new MythTvModule(SmartHub.config.mythtv);
	mythTvModule.registerApis();
	return mythTvModule;
};

module.exports = MythTvModule;
