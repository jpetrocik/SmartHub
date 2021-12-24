const plivo = require('plivo');



class PlivoModule {

	constructor() {
        this.config = SmartHub.config.plivo;
        this.client = new plivo.Client(this.config.id, this.config.token);

        SmartHub.on("Notification.SEND", (message, notificationHash) => {

            let body = message + "\n\n\nTo silence for 24 hours\nhttp://petrocik.net:2157/api/notification/silence/?hash=" + notificationHash;
            this.config.sendTo.forEach((phone) => {
                this.sendSms(phone, body);
            });

        });

    }

    sendSms(phone, message) {
        if (!this.config.enabled)
            return;

        this.client.messages.create(
            this.config.phone,
            phone,
            message
        ).then(function(message_created) {
            console.log("Sent sms to " + phone);
        });
    }

};

PlivoModule.init = function(){
	let plivoModule = new PlivoModule();
	return plivoModule;
};


module.exports = PlivoModule;
