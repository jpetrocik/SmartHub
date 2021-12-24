
const FirebaseAdmin = require("firebase-admin");
const FirebaseMessage = require("firebase-admin/messaging");

const serviceAccount = require("../smarthub-6e164-firebase-adminsdk-y3mkt-5d0a2c6c52.json");


class FirebaseModule {

	constructor() {
        this.config = SmartHub.config.firebase;
        this.firebaseAdmin = FirebaseAdmin.initializeApp({
            credential: FirebaseAdmin.credential.cert(serviceAccount)
          });

        SmartHub.on("Notification.SEND", (message, notificationHash) => {
            this.sendMessage("alerts", message, notificationHash);
        });

    }

    sendMessage(topic, title, notificationHash) {
        if (!this.config.enabled)
            return;

        const messageSender = FirebaseMessage.getMessaging(this.firebaseAdmin)
        let payload = {
            notification: {
                title: title
            },
            topic: topic
        };

        messageSender.send(payload).then((result) => {
            console.log("Sending firebase message: " + title);
        }).catch( e => {
            console.log("Failed to send firebase message");
            console.log(e);
        });

    }

};

FirebaseModule.init = function(){
	let firebaseModule = new FirebaseModule();
	return firebaseModule;
};


module.exports = FirebaseModule;
