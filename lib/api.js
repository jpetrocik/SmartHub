const express = require('express');

module.exports = function() {

    let router = express.Router();

	console.log("Registering /notification/silence")
	router.get("/notification/silence/*", (req, res) => {
		SmartHub.notificationModule.silence(req.query.hash);

		res.sendStatus(200);
	});

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

