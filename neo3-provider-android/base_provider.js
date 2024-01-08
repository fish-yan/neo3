
"use strict";

import { EventEmitter } from "events";

class BaseProvider extends EventEmitter {
  constructor(config) {
    super();
    this.isDebug = false;
    this.callBackMap = new Map();
  }

  /**
   * @private Internal js -> native message handler
   */
  postMessage(data) {
    if (window.n3wallet.postMessage) {
      this.log('postMessage to aptos wallet')
      window.n3wallet.postMessage(data);
    } else {
      console.error("postMessage is not available");
    }
  }

  /**
   * @private Internal native result -> js
   */
  sendResponse(id, result) {
    let callback = this.callBackMap.get(id);
    let jsonResult = JSON.parse(result);

    this.log(`<== sendResponse id: ${id}, result: ${JSON.parse(result)}`)
    if (callback) {
      callback(null, jsonResult);
      this.callBackMap.delete(id);
    } else {
      this.log(`callback id: ${id} not found`);
    }
  }

  /**
   * @private Internal native error -> js
   */
   sendError(id, error) {
    this.log(`<== ${id} sendError ${error}`);
    let callback = this.callBackMap.get(id);
    if (callback) {
      callback(error instanceof Error ? error : new Error(error), null);
      this.callBackMap.delete(id);
    }
  }

  log(obj) {
    if (this.isDebug) {
      console.log(obj);
    }
  }
}

module.exports = BaseProvider;
