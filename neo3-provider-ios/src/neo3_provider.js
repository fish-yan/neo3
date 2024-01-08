
"use strict";
import { rpc } from "@cityofzion/neon-core";
import BaseProvider from "./base_provider";

export default class N3Web3Provider extends BaseProvider {

  constructor(config) {
    super(config);
    this.requestId = 0;
    this.rpcUrl = "https://n3seed1.ngd.network:10332/";
    this.address = config.address;
    this.label = config.label;
    this.publicKey = config.publicKey;
    this.rpcClient = new rpc.RPCClient(this.rpcUrl);
    this.magicNumber = 860833102
  }
  _getProvider() {
    return new Promise(function (resolve, reject) {
      resolve({
        name: "ONTO",
        website: "https://onto.app/",
        version: "1.0.0",
        compatibility: [],
        extra: {}
      })
    })
  }

  _getAccount() {
    let that = this;
    return new Promise(function (resolve, reject) {
      resolve({
        address: that.address,
        label: that.label,
        publicKey: that.publicKey
      })
    })
  }

  _getNetworks() {
    return new Promise(function (resolve, reject) {
      resolve({
        networks: ["MainNet"],
        defaultNetwork: "MainNet",
        chainId: 3
      })
    });
  }

  _getBlockCount() {
    let that = this
    return new Promise(function (resolve, reject) {
      that.rpcClient.getBlockCount()
        .then(count => {
          resolve(count)
        })
        .catch(error => {
          reject(error)
        })
    })
  }

  _getBlock(params) {
    let that = this
    return new Promise(function (resolve, reject) {
      that.rpcClient.getBlock(params.blockIndex)
        .then(count => {
          resolve(count)
        })
        .catch(error => {
          reject(error)
        })
    })
  }

  _getBalance() {
    let that = this;
    return new Promise(function (resolve, reject) {
      that.rpcClient.getNep17Balances(that.address)
        .then(result => {
          var data = new Array();
          result.balance.forEach(element => {
            let map = {
              assetHash: element.assethash,
              amount: element.amount,
            }
            data.push(map);
          });
          resolve(data);
        })
        .catch(error => {
          reject(error);
        })
    })
  }

  async getTransaction(params) {
    return new Promise((resolve, reject) => {
      this.rpcClient.getTransaction(params.txid)
        .then(result => {
          resolve(result)
        })
        .catch(error => {
          reject({
            type: 'RPC_ERROR',
            description: 'An RPC error occured when submitting the request',
            data: null
          })
        })
    })
  }

  async _getApplicationLog(params) {
    return new Promise((resolve, reject) => {
      this.rpcClient.getApplicationLog(params.txid)
        .then(result => {
          const executions = result.executions.map(ele => {
            return {
              trigger: ele.trigger,
              vmState: ele.vmstate,
              exception: ele.exception,
              gasConsumed: ele.gasconsumed,
              stack: ele.stack,
              notifications: ele.notifications
            }
          })
          resolve({
            txid: result.txid,
            executions: executions
          })
        })
        .catch(error => {
          reject({
            type: 'RPC_ERROR',
            description: 'An RPC error occured when submitting the request',
            data: null
          })
        })
    })
  }

  async _forwarding(data) {
    return new Promise((resolve, reject) => {
      this._message("forwarding", data)
        .then(result => {
          if (result.error) {
            reject(result.error);
          } else {
            resolve(result);
          }
        })
        .catch(error => {
          reject(error)
        })
    })
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

      that.callBackMap.set(id, (error, data) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
      that.postMessage(JSON.stringify(body))
    })
  }

  request(data) {
    switch (data.method) {
      case "getProvider":
        return this._getProvider();
      case "getAccount":
        return this._getAccount();
      case "getNetworks":
        return this._getNetworks();
      case "getBlockCount":
        return this._getBlockCount();
      case "getBlock":
        return this._getBlock(data.params)
      case "getNep17Balances":
        return this._getBalance();
      case "getApplicationLog":
        return this._getApplicationLog(data.params)
      case "invokeMulti":
      case "invoke":
      case "signMessage":
      case "signTransaction":
        return this._forwarding(data);
      default:
        return this._message(data.method, data);
    }
  }
}

