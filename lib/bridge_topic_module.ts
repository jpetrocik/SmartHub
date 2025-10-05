class Bridge {
    source: string;
    destination: string;
    retain: boolean;
    lwt: number;
    timeout: NodeJS.Timeout | null;

    constructor(source: string, destination: string, retain: boolean = false) {
        this.source = source;
        this.destination = destination;
        this.retain = retain;
        this.lwt = 5000;
    }
}

export class BridgeTopicModule {
    private bridges: Map<String, Bridge>;

    constructor(birdges: Bridge[]) {
        global.SmartHub.mqttClient.on('message', this.onMessage.bind(this));

        this.bridges = (global.SmartHub.config.bridge as Bridge[]).reduce((map, obj) => {
            console.log(`Setting up bridge from ${obj.source} to ${obj.destination}`);
            map.set(obj.source, obj as Bridge);
            return map;
        }, new Map<String, Bridge>());

        this.bridges.forEach((bridge, topic) => {
            global.SmartHub.mqttClient.subscribe(topic);
            if (bridge.lwt) {
                bridge.timeout = setTimeout(() => {
                    global.SmartHub.mqttClient.publish(`${bridge.destination}/LWT`, "offline", { retain: true });
                }, bridge.lwt);
            }
        });
    }

    onMessage(topic: string, data: any): void {
        let bridge = this.bridges.get(topic);
        if (bridge) {
            console.log(`Bridging message from ${bridge.source} to ${bridge.destination}`);
            global.SmartHub.mqttClient.publish(bridge.destination, data, { retain: bridge.retain });

            if (bridge.timeout) {
                clearTimeout(bridge.timeout);
            }

            if (bridge.lwt) {
                bridge.timeout = setTimeout(() => {
                    global.SmartHub.mqttClient.publish(`${bridge.destination}/LWT`, "offline", { retain: true });
                }, bridge.lwt);
                global.SmartHub.mqttClient.publish(`${bridge.destination}/LWT`, "online", { retain: true });
            }
        }
    }

    static init() {
        if (!global.SmartHub.config.bridge || global.SmartHub.config.bridge.length === 0) {
            console.log("No bridge configuration found");
            return;
        }

        let brige = new BridgeTopicModule(global.SmartHub.config.bridge as Bridge[]);

        global.SmartHub.modules["bridgeTopicModule"] = brige;
    }
}

