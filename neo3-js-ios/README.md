neo3-js-ios 为iOS端提供 Neo N3 链签名和交易等相关功能。

目前支持 nep11 和 nep17 交易

## build
```
yarn
yarn build
```
drop the product to project

## feature

### transfer
用于构建 nep11 和 nep17 交易

输入 input 参数，构建 translation
```js
interface CreateNeo3TxInput {
    addressFrom: string;
    addressTo: string;
    tokenScriptHash: string;
    amount: any;
    networkFee: number;
    decimals: number;
    nftTokenId?: any;
}
```

输出

```js
{
    txid: txHash,
    networkFee: txid,
    systemFee: systemFee,
    block_time: string
}
```

### forwarding
用于转发 dapp 交易加签等操作
```js
signTransaction
signMessage
invoke
invokeMulti
```

## 参考
### 项目
[neoline](https://github.com/NeoNEXT/neoline)

[dapp demo](https://github.com/neo-ngd/neo-dapi-demo)

[dapp dapi](https://github.com/neo-ngd/neo-dapi-monorepo)

### 文档
[neoline](https://neoline.io/dapi/N3.html#startExample)

[rpc api](https://docs.neo.org/docs/zh-cn/reference/rpc/latest-version/api.html)