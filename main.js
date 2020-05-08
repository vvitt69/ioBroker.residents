'use strict';

const utils = require('@iobroker/adapter-core');

let stateEnum = new Array();
 stateEnum[0] = {state:"none", val:0};
 stateEnum[1] = {state:"gone", val:1};
 stateEnum[2] = {state:"away", val:2};
 stateEnum[3] = {state:"leaving", val:3};
 stateEnum[4] = {state:"comming", val:4};
 stateEnum[5] = {state:"around", val:5};
 stateEnum[6] = {state:"inhouse", val:6};
 stateEnum[7] = {state:"asleep", val:7};
 stateEnum[8] = {state:"gotosleep", val:8};
 stateEnum[9] = {state:"awoken", val:9};
 stateEnum[10] = {state:"home", val:10};

if (Object.freeze)
  Object.freeze(stateEnum);

class Residents extends utils.Adapter {
      /**
     * @param {Partial<ioBroker.AdapterOptions>} [options={}]
     */
    constructor(options) {
        super({
            ...options,
            name: 'residents',
        });
        this.allResidents = [];

        this.on('ready', this.onReady.bind(this));
        this.on('objectChange', this.onObjectChange.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        // this.on('message', this.onMessage.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }

    async onReady() {
        await this.setObjectNotExists('state', {
          type: 'state',
          common: {
              name: 'state',
              type: 'string',
              role: 'value',
              read: true,
              write: true,
          },
          native: {},
        });
        await this.setStateAsync('state', 'gone');

        await this.setObjectNotExists(this.config.resident1 + '.name', {
          type: 'state',
          common: {
              name: this.config.resident1,
              type: 'string',
              role: 'text',
              read: true,
              write: false,
          },
          native: {},
        });
        await this.setObjectNotExists(this.config.resident1 + '.state', {
          type: 'state',
          common: {
              name: 'state',
              type: 'string',
              role: 'value',
              read: true,
              write: true,
          },
          native: {},
        });

        await this.setStateAsync(this.config.resident1 + '.name', {val: this.config.resident1, ack: true});
        await this.setStateAsync(this.config.resident1 + '.state', 'gone');

        await this.setObjectNotExists(this.config.resident2 + '.name', {
          type: 'state',
          common: {
              name: this.config.resident2,
              type: 'string',
              role: 'text',
              read: true,
              write: false,
          },
          native: {},
        });
        await this.setObjectNotExists(this.config.resident2 + '.state', {
          type: 'state',
          common: {
              name: 'state',
              type: 'string',
              role: 'value',
              read: true,
              write: true,
          },
          native: {},
        });

        await this.setStateAsync(this.config.resident2 + '.name', {val: this.config.resident2, ack: true});
        await this.setStateAsync(this.config.resident2 + '.state', 'gone');

        this.subscribeStates('*');
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     * @param {() => void} callback
     */
    onUnload(callback) {
        try {
            this.log.info('cleaned everything up...');
            callback();
        } catch (e) {
            callback();
        }
    }

    /**
     * Is called if a subscribed object changes
     * @param {string} id
     * @param {ioBroker.Object | null | undefined} obj
     */
    onObjectChange(id, obj) {
        if (obj) {
            // The object was changed
            this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
        } else {
            // The object was deleted
            this.log.info(`object ${id} deleted`);
        }
    }

    /**
     * Is called if a subscribed state changes
     * @param {string} id
     * @param {ioBroker.State | null | undefined} state
     */
    onStateChange(id, state) {
      if (id != this.namespace + '.state') { //no prcessing for overall state
        if (state) {
            this.log.debug('Entered onStateChange processing with id: ' + id);
            this.log.debug('and state.val: ' + state.val);
            //this.log.debug('Entered onStateChange processing with id: ' + id);
            // The state was changed
            if(stateEnum.find(item => item.state == state.val)){ // valid state given
                //get the numeric value of the state
                var newValue = 0;
                stateEnum.forEach((item, i) => {
                  if (state.val == item.state)
                    newValue = item.val;
                  });

                  //asign the value to the resident in the array
                  var found = this.allResidents.find(element => element.name === id); //check, if resistent is already in array
                  if (found == undefined){ //not in: insert it
                    this.allResidents.push({name: id, val:newValue});
                  } else { //in: update it
                    var index = this.allResidents.indexOf(found);
                    this.allResidents[index] = {name: id, val:newValue};
                }
                //find highest value in array
                var maxValue = 0;
                this.allResidents.forEach((item, i) => {
                  if(item.val > maxValue)
                    maxValue = item.val; //stateEnum
                  });
                //set overall stateEnum
                this.setStateAsync('state', stateEnum[maxValue].state);

                //debug results
                this.allResidents.forEach((item, i) => {
                  this.log.debug(item.name + ' is ' + item.val);
                  });
                this.log.debug('max Value is ' + maxValue);

                } else { //invalid state given
                this.log.warn(state.val + ' is not a valid value for a residents state. Switching to gone');
                this.setStateAsync(id,'gone');
            }

          } else {
              // The state was deleted
              this.log.info(`state ${id} deleted`);
          }
        }
    }

}

// @ts-ignore parent is a valid property on module
if (module.parent) {
    // Export the constructor in compact mode
    /**
     * @param {Partial<ioBroker.AdapterOptions>} [options={}]
     */
    module.exports = (options) => new Residents(options);
} else {
    // otherwise start the instance directly
    new Residents();
}
