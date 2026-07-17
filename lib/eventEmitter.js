import { EventEmitter } from 'events';

const globalForEvents = global;

if (!globalForEvents.syncEventEmitter) {
  globalForEvents.syncEventEmitter = new EventEmitter();
  // Increase max listeners to prevent warnings when multiple clients connect
  globalForEvents.syncEventEmitter.setMaxListeners(200);
}

export const syncEventEmitter = globalForEvents.syncEventEmitter;
