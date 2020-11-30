const express = require('express');

module.exports = function() {

    let router = express.Router();

	console.log("Registering /notification/silence")
	router.get("/notification/silence/*", (req, res) => {
		let path = req.path.substring(22);

		SmartHub.notificationModule.silence(path, req.query.hash);

		res.sendStatus(200);
	});

    console.log("Registering /playRecording");
	router.post("/playRecording", (req, res) => {

		let chanId = req.query.chanId;
		let startTime = req.query.startTime;

		//Switch TV input to HDMI1
		SmartHub.lgTvModule.input("com.webos.app.hdmi1").then((value) => {

			//Play Recording
			SmartHub.mythTvModule.play(chanId, startTime).then((value) => {

				//Set TV Volume to 0
				SmartHub.lgTvModule.volume(0).then((value) => {

					//Switch Reciever input to MythTv
					SmartHub.onkyoModule.input("01").then((value) => {

						//Switch Reciever input to MythTv
						SmartHub.onkyoModule.volume("32").then((value) => {
							console.log("playRecording completed");
							res.sendStatus(200);
						});
					});
				});
			});
		});

	});

    console.log("Registering /watchTV")
	router.post("/watchTV", (req, res) => {

		let chanNum = req.query.chanNum;

		//Switch TV input to LiveTV
		SmartHub.lgTvModule.input("com.webos.app.livetv").then((value) => {

			//Change change
			SmartHub.lgTvModule.channel(chanNum).then((value) => {

				//Set TV volumne to 0
				SmartHub.lgTvModule.volume(0).then((value) => {

					//Switch Reciever input to MythTv
					SmartHub.onkyoModule.input("12").then((value) => {

						//Switch Reciever input to MythTv
						SmartHub.onkyoModule.volume("32").then((value) => {
							console.log("watchTV completed");
							res.sendStatus(200);
						});
					});
				});
			});
		});
	});

	return router;
}


// SmartHub.lgTvModule.powerOff().then((value) => {
// 	console.log(value)
// });

/*
10 BD/DVD
01 CBL/SAT -> Mythtv
05 PC -> Chromecast
12 TV
*/
	// SmartHub.mythTvModule.stop("2041", "2018-01-20T02:30:00Z").then((value) => {
	// 	console.log(value);
	// });

