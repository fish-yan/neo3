
"use strict";

import BaseProvider from "./base_provider";
import Neo3InvokeService from "./invoke"

class N3Web3Provider extends BaseProvider {

  constructor(config) {
    super(config);
    this._setConfig(config);
    this.requestId = 0;
  }

  _setConfig(config) {
    this.address = config.address;
    this.publicKey = config.publicKey;
    this.rpcUrl = "https://n3seed1.ngd.network:10332/";
    this.neo3InvokeService = new Neo3InvokeService(this.rpcUrl);
  }

  _getProvider() {
    return new Promise(function (resolve, reject) {
      resolve({
        name: 'ONTO',
        website: 'https://www.ont.io/',
        version: '1.0.0',
        compatibility: [],
        extra: {
          currency: 'USD',
          theme: ''
        }
      });
    })
  }

  _getAccount() {
    const that = this;
    return new Promise(function (resolve, reject) {
      resolve({
        address: that.address,
        publicKey: that.publicKey
      });
    })
  }

  _getNetworks() {
    return new Promise(function (resolve, reject) {
      resolve({
        chainId: 3,
        networks: ["MainNet"],
        defaultNetwork: "MainNet"
      });
    })
  }

  /**
   * dApp will automatically call
   */
  request(data) {
    this.log("======= method: " + data.method + " ====== data= " + JSON.stringify(data));
    let method = data.method;

    switch (method) {
      case 'getProvider':
        return this._getProvider();
      case 'getAccount':
        return this._getAccount();
      case 'getNetworks':
        return this._getNetworks();
      case 'getNep17Balances':
        return this.neo3InvokeService._getNep17balances(data);
      case 'invoke':
      case 'invokeMulti':
      case 'signMessage':
        return this._message(method, data);
      case 'getApplicationLog':
        return this.neo3InvokeService._getApplicationLog(data);
      default:
        const errorResponse = {
          code: -32601,
          message: 'Method not found',
        };
        return Promise.reject(errorResponse);
    }
  }

  _message(method, data) {
    const id = ++this.requestId
    let body = {
      id: id,
      method: method,
      data: data
    }
    const that = this;
    return new Promise(function (resolve, reject) {
      that.log(method + "  ==== " + data);

      that.callBackMap.set(id, (error, data) => {
        that.log('set callback' + " === data: " + data + " ==== error: " + error);
        if (error) {
          that.log('reject');
          reject(error);
        } else {
          that.log('resolve');
          resolve(data);
        }
      });
      that.postMessage(JSON.stringify(body))
    })
  }

}

module.exports = N3Web3Provider;
