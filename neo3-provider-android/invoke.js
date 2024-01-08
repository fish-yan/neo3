import {rpc} from "@cityofzion/neon-core-neo3";

class Neo3InvokeService {
    rpcClient;

    constructor(rpcUrl) {
        this.rpcUrl = rpcUrl;
        this.magicNumber = 860833102;
        this.rpcClient = new rpc.RPCClient(rpcUrl)
    }

    _getNep17balances(data) {
        const that = this;
        return new Promise(function (resolve, reject) {
            that.rpcClient.getNep17Balances(data.params.address)
                .then(result => {
                    const balances = [];
                    result.balance.forEach(element => {
                        let map = {
                            assetHash: element.assethash,
                            amount: element.amount,
                        }
                        balances.push(map);
                    });
                    resolve(balances);
                })
                .catch(error => {
                    reject(error);
                })
        })
    }

    _getApplicationLog(data) {
        const s = {
            "txid": "0xa845f3e40643b82641dce2e4539970ceac39e7fd6b3ec675c2f47a7f59e296f9",
            "executions": [
                {
                    "trigger": "Application",
                    "vmState": "HALT",
                    "exception": null,
                    "gasConsumed": "4275384",
                    "stack": [
                        {
                            "type": "Boolean",
                            "value": true
                        }
                    ],
                    "notifications": [
                        {
                            "contract": "0xef4073a0f2b305a38ec4050e4d3d28bc40ea63f5",
                            "eventName": "Transfer",
                            "state": {
                                "type": "Array",
                                "value": [
                                    {
                                        "type": "ByteString",
                                        "value": "+uOvy3Pv21xa25H5M6iyyENV4Hw="
                                    },
                                    {
                                        "type": "ByteString",
                                        "value": "KkyaTUAiZ4sD7xu+CDT5ZkYNxEg="
                                    },
                                    {
                                        "type": "Integer",
                                        "value": "1"
                                    }
                                ]
                            }
                        },
                        {
                            "contract": "0xef4073a0f2b305a38ec4050e4d3d28bc40ea63f5",
                            "eventName": "Transfer",
                            "state": {
                                "type": "Array",
                                "value": [
                                    {
                                        "type": "ByteString",
                                        "value": "KkyaTUAiZ4sD7xu+CDT5ZkYNxEg="
                                    },
                                    {
                                        "type": "ByteString",
                                        "value": "4oP+pT0wKfnwBMkpFn1TeO7itH8="
                                    },
                                    {
                                        "type": "Integer",
                                        "value": "1"
                                    }
                                ]
                            }
                        },
                        {
                            "contract": "0xd2a4cff31913016155e38e474a2c06d08be276cf",
                            "eventName": "Transfer",
                            "state": {
                                "type": "Array",
                                "value": [
                                    {
                                        "type": "Any"
                                    },
                                    {
                                        "type": "ByteString",
                                        "value": "4oP+pT0wKfnwBMkpFn1TeO7itH8="
                                    },
                                    {
                                        "type": "Integer",
                                        "value": "180338848"
                                    }
                                ]
                            }
                        },
                        {
                            "contract": "0x48c40d4666f93408be1bef038b6722404d9a4c2a",
                            "eventName": "Transfer",
                            "state": {
                                "type": "Array",
                                "value": [
                                    {
                                        "type": "Any"
                                    },
                                    {
                                        "type": "ByteString",
                                        "value": "+uOvy3Pv21xa25H5M6iyyENV4Hw="
                                    },
                                    {
                                        "type": "Integer",
                                        "value": "100000000"
                                    }
                                ]
                            }
                        },
                        {
                            "contract": "0xd2a4cff31913016155e38e474a2c06d08be276cf",
                            "eventName": "Transfer",
                            "state": {
                                "type": "Array",
                                "value": [
                                    {
                                        "type": "Any"
                                    },
                                    {
                                        "type": "ByteString",
                                        "value": "+uOvy3Pv21xa25H5M6iyyENV4Hw="
                                    },
                                    {
                                        "type": "Integer",
                                        "value": "2"
                                    }
                                ]
                            }
                        }
                    ]
                }
            ]
        };
        return Promise.resolve(s);
    }
}

module.exports = Neo3InvokeService
