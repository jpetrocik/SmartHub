const plivo = require('plivo');



class PlivoModule {

	constructor(SmartHub) {
        this.config = SmartHub.config.plivo;
        this.client = new plivo.Client(this.config.id, this.config.token);

        SmartHub.on("SmsModule.SEND", (phone, message) => {
            this.sendSms(phone, message);
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

PlivoModule.init = function(SmartHub){
	let plivoModule = new PlivoModule(SmartHub);
	return plivoModule;
};


module.exports = PlivoModule;
