import { rpc, wallet, sc, tx, u } from "@cityofzion/neon-core";
import { Buffer } from "buffer";
import BigNumber from 'bignumber.js';

interface CreateNeo3TxInput {
    addressFrom: string;
    addressTo: string;
    tokenScriptHash: string;
    amount: any;
    networkFee: number;
    decimals: number;
    nftTokenId?: any;
}

export class Neo3TransferService {
    private rpcClient: rpc.RPCClient
    private magicNumber: number = 860833102;
    private rpcUrl: string = "https://n3seed1.ngd.network:10332/";

    constructor(private wif: string) {
        this.rpcClient = new rpc.RPCClient(this.rpcUrl)
    }

    async createNeo3Tx(params: CreateNeo3TxInput) {
        const neo3This = this;
        const rpcClientTemp = this.rpcClient;
        const vars: any = {};

        const tempScriptHash = wallet.getScriptHashFromAddress(params.addressFrom)
        params.amount = BigNumber(params.amount).multipliedBy(BigNumber(10).pow(params.decimals)).toFixed();

        const inputs = {
            scriptHash: tempScriptHash,
            fromAccountAddress: params.addressFrom,
            toAccountAddress: params.addressTo,
            tokenScriptHash: params.tokenScriptHash,
            amountToTransfer: params.amount,
            systemFee: 0,
            networkFee: BigNumber(params.networkFee).toFixed() || 0,
        };


        /**
         * createScript
         */
        let script: string;
        if (params.nftTokenId) {
            script = sc.createScript({
                scriptHash: inputs.tokenScriptHash,
                operation: 'transfer',
                args: [
                    sc.ContractParam.hash160(inputs.toAccountAddress),
                    sc.ContractParam.byteArray(u.hex2base64(params.nftTokenId)),
                    sc.ContractParam.any(null),
                ],
            });
        } else {
            script = sc.createScript({
                scriptHash: inputs.tokenScriptHash,
                operation: 'transfer',
                args: [
                    sc.ContractParam.hash160(inputs.fromAccountAddress),
                    sc.ContractParam.hash160(inputs.toAccountAddress),
                    sc.ContractParam.integer(inputs.amountToTransfer),
                    sc.ContractParam.any(null),
                ],
            });
        }

        /**
         * createTransaction
         */
        async function createTransaction() {

            // We retrieve the current block height as we need to
            const currentHeight = await rpcClientTemp.getBlockCount();
            vars.tx = new tx.Transaction({
                signers: [
                    {
                        account: inputs.scriptHash,
                        scopes: tx.WitnessScope.CalledByEntry,
                    },
                ],
                validUntilBlock: currentHeight + 30,
                systemFee: vars.systemFee,
                script,
            });
        }

        /**
        * SystemFees 
        */
        async function checkSystemFee() {
            
            let invokeFunctionResponse = await rpcClientTemp.invokeScript(
                u.HexString.fromHex(script).toBase64(),
                [
                    {
                        account: inputs.scriptHash,
                        scopes: tx.WitnessScope[tx.WitnessScope.CalledByEntry],
                    }
                ]
            )
            
            if (invokeFunctionResponse.state !== 'HALT') {
                throw {messsage: 'check systemFee error'};
            }
            const requiredSystemFee = new BigNumber(invokeFunctionResponse.gasconsumed);
            if (inputs.systemFee && new BigNumber(inputs.systemFee) >= requiredSystemFee) {
                vars.tx.systemFee =  u.BigInteger.fromNumber((new BigNumber(inputs.systemFee)).toFixed());
            } else {
                vars.tx.systemFee = u.BigInteger.fromNumber(requiredSystemFee.toFixed());
            }
        }

        /**
         * Network fees
         */
        async function checkNetworkFee() {
            let txClone = vars.tx.export();
            txClone.systemFee = new BigNumber(vars.tx.systemFee).shiftedBy(8).toFixed(0);
            txClone = new tx.Transaction(txClone);
            txClone.sign(neo3This.wif, neo3This.magicNumber);
            let signedTx = txClone.serialize(true);
            let baseTx1 = Buffer.from(signedTx, 'hex').toString('base64')
            const fee = await rpcClientTemp.calculateNetworkFee(baseTx1)
            let networkFee = new BigNumber(fee) + new BigNumber(params.networkFee || 0).toFixed();
            vars.tx.networkFee =  u.BigInteger.fromNumber(networkFee);
        }

        await createTransaction();
        await checkSystemFee();
        await checkNetworkFee();
        return vars.tx;
    }

    async sendNeo3Tx(txn: tx.Transaction) {
        txn.sign(this.wif, this.magicNumber);
        let signedTx = txn.serialize(true);
        let baseTx1 = Buffer.from(signedTx, 'hex').toString('base64');
        let txHash = await this.rpcClient.sendRawTransaction(baseTx1);
        return txHash;
    }
}