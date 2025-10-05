const util = require('util');
const { Client } = require('tplink-smarthome-api')

const client = new Client();
const devices = {};

class TPLinkModule {

    constructor(config, mqttClient) {
        this.config = config;
        this.mqttClient = mqttClient;
    }

    discoverDevices() {
        client.on('device-new', (device) => {
            console.log("Found TPLink device " + device.name);
            const topic = device.alias.replaceAll(" ", "/").toLowerCase();
            device.commandTopic = `house/${topic}/command`;
            device.statusTopic = `house/${topic}/status`;
            devices[device.commandTopic] = device;
            this.subscribe(device.commandTopic);

            device.startPolling(30000);

            device.on('power-on', () => {
                console.log("Sending status on");
                this.sendStatusMessage(device)
            });

            device.on('power-off', () => {
                console.log("Sending status on");
                this.sendStatusMessage(device)
            });
        });

        console.log('Starting Device Discovery');
        client.startDiscovery();
    }

    sendStatusMessage(device) {
        let status = {
            status: device.relayState ? "ON" : "OFF"
        }
        this.mqttClient.publish(device.statusTopic, JSON.stringify(status));
    }

    processCommand(device, command) {
        if (command == 3) {
            this.sendStatusMessage(device);
        } else if (command == 1) {
            device.setPowerState(true);
        } else if (command == 0) {
            device.setPowerState(false);
        }
    }

    subscribeHouseTopic() {
        console.log("Subscribing to house/command");
        this.mqttClient.subscribe("house/command");
    }

    subscribe(topic) {
        console.log("Subscribing to " + topic);
        this.mqttClient.subscribe(topic);
        this.mqttClient.on('message', this.onMessage.bind(this));
    }

    onMessage(topic, message) {
        if (topic == "house/command") {
            console.log("Message recieved on " + topic);
            var command = message.toString();
            for (let device in devices) {
                this.processCommand(devices[device], command);
            };
        } else {
            var command = message.toString();
            var device = devices[topic];
            if (device) {
                console.log("Message recieved on " + topic);
                this.processCommand(device, command);
            }
        }
    }
};

TPLinkModule.init = function () {
    let tpLinkModule = new TPLinkModule(SmartHub.config.tplink, SmartHub.mqttClient);
    tpLinkModule.subscribeHouseTopic();
    tpLinkModule.discoverDevices();
    
    SmartHub.modules["tpLinkModule"] = tpLinkModule;
};

module.exports = TPLinkModule;
