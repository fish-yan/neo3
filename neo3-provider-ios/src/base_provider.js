
"use strict";

import { EventEmitter } from "events";

export default class BaseProvider extends EventEmitter {
  constructor(config) {
    super();
    this.callBackMap = new Map();
  }

  /**
   * @private Internal js -> native message handler
   */
  postMessage(data) {
    if (window.n3wallet.postMessage) {
      window.n3wallet.postMessage(data);
    } else {
      console.error("postMessage is not available");
    }
  }

  /**
   * @private Internal native result -> js
   */
  sendResponse(id, data) {
    let result;
    let isIOS = !!navigator.userAgent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/);  
    if (isIOS) {
      result = data;
    } else {
      result = JSON.parse(data);
    }
    let callback = this.callBackMap.get(id);
    if (callback) {
      callback(null, result);
      this.callBackMap.delete(id);
    } else {
      console.log(`callback id: ${id} not found`);
    }
  }

  /**
   * @private Internal native error -> js
   */
   sendError(id, error) {
    console.log(`<== ${id} sendError ${error}`);
    let callback = this.callBackMap.get(id);
    if (callback) {
      callback(error instanceof Error ? error : new Error(error), null);
      this.callBackMap.delete(id);
    }
  }
}
