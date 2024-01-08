
"use strict";
import { rpc } from "@cityofzion/neon-core";
import BaseProvider from "./base_provider";
import { Neo3InvokeService } from "./neo3-invoke.ts";
import { Neo3TransferService } from "./neo3-transfer.ts";
import { Transaction } from "@cityofzion/neon-core/lib/tx";

export default class N3Web3Provider extends BaseProvider {
  constructor() {
    super();
    this.requestId = 0;
    this.rpcUrl = "https://n3seed1.ngd.network:10332/";
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

  async _getAccount(params) {
    return new Promise(function (resolve, reject) {
      resolve({
        address: params.address,
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

  async _getBalance(params) {
    let that = this;
    return new Promise(function (resolve, reject) {
      that.rpcClient.getNep17Balances(params.address)
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

  async _signMessage(params) {
    const invoke = new Neo3InvokeService(params.wif);
    return new Promise((resolve, reject) => {
      if (params.message === undefined) {
        resolve({
          error: {
            type: "FAIL",
            description: "message is undefined"
          }
        });
      } else {
        const result = invoke.signature(params.message);
        resolve(result);
      }
    });
  }

  async _signTransaction(params) {
    return new Promise((resolve, reject) => {
      let neo3 = new Neo3InvokeService(params.wif);
      let invocations = neo3.createInvokeInputs(params);
      neo3.createNeo3Tx({
        invokeArgs: invocations,
        signers: params.signers,
        networkFee: params.networkFee,
        systemFee: params.extraSystemFee,
        overrideSystemFee: params.overrideSystemFee,
      }).then(txn => {
        const data = neo3.signTransaction(txn);
        resolve(data);
      })
        .catch(error => {
          resolve({ error: error })
        })
    })
  }

  async _invokeMulti(params) {
    let that = this;
    return new Promise(function (resolve, reject) {
      let neo3 = new Neo3InvokeService(params.wif);
      let invocations = neo3.createInvokeInputs(params);
      neo3.createNeo3Tx({
        invokeArgs: invocations,
        signers: params.signers,
        networkFee: params.networkFee,
        systemFee: params.extraSystemFee,
        overrideSystemFee: params.overrideSystemFee,
      }).then(txn => {
        neo3.sendNeo3Tx(txn)
          .then(txHash => {
            resolve({
              txid: txHash,
              nodeUrl: that.rpcUrl
            });
          })
          .catch(error => {
            if (error.message == "InsufficientFunds") {
              resolve({
                error: {
                  type: "INSUFFICIENT_FUNDS",
                  description: "The user has insufficient funds to execute this transaction."
                }
              });
            } else {
              resolve({
                error: {
                  type: "FAIL",
                  description: error.message
                }
              });
            }
          })
      }).catch(error => {
        resolve({
          error: error
        })
      });
    })
  }

  async _transfer(data) {
    let transfer = new Neo3TransferService(data.wif);
    try {
      let txn = await transfer.createNeo3Tx(data);
      let txHash = await transfer.sendNeo3Tx(txn);
      return {
        txid: txHash,
        networkFee: txn.networkFee,
        systemFee: txn.systemFee,
        block_time: new Date().getTime() / 1000
      };
    } catch (error) {
      return {
        error: {
          type: "FAIL",
          description: error.message
        }
      }
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

  async request(data) {
    switch (data.method) {
      case "getProvider":
        return this._getProvider();
      case "getAccount":
        return this._getAccount(data.params);
      case "getNetworks":
        return this._getNetworks();
      case "getBlockCount":
        return this._getBlockCount();
      case "getNep17Balances":
        return this._getBalance(data.params);
      case "invokeMulti":
      case "invoke":
        return this._invokeMulti(data.params);
      case "signMessage":
        return this._signMessage(data.params);
      case "signTransaction":
        return this._signTransaction(data.params);
      default:
        return this._message(data.method, data);
    }
  }

  /**
   * @private Native  call js
   */
  async postMessageToJs(data) {
    let result;
    let isIOS = !!navigator.userAgent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/);
    if (isIOS) {
      result = data;
    } else {
      result = JSON.parse(data);
    }
    let body = {
      method: result.method
    }
    switch (result.method) {
      case "transfer":
        body.data = await this._transfer(result.data)
        break;
      case "forwarding":
        body.data = await this.request(result.data)
        break;
      default:
        break;
    }
    this.postMessage(body)
  }
}

