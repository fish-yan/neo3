import { rpc, sc, tx, u, wallet } from "@cityofzion/neon-core";
import BigNumber from "bignumber.js";
import { randomBytes } from "crypto";
import { Buffer } from "buffer";


interface CreateNeo3TxInput {
    invokeArgs: sc.ContractCall[];
    signers: tx.SignerLike[];
    networkFee: string;
    systemFee?: any;
    overrideSystemFee?: any,
}

export class Neo3InvokeService {
    private rpcClient: rpc.RPCClient;
    private magicNumber: number = 860833102;
    private rpcUrl: string = "https://n3seed1.ngd.network:10332/";
    constructor(private wif?: string) {
        this.rpcClient = new rpc.RPCClient(this.rpcUrl)
    }

    async createNeo3Tx(params: CreateNeo3TxInput) {
        const neo3This = this;
        const rpcClientTemp = this.rpcClient;
        const vars: any = {};

        const signerJson = params.signers.map((signerItem) => {
            let scopes = signerItem.scopes;
            if (isNaN(Number(signerItem.scopes)) === false && tx.WitnessScope[signerItem.scopes]) {
                scopes = tx.WitnessScope[signerItem.scopes];
            }
            return {
                account: signerItem.account,
                scopes,
                allowedcontracts:
                    signerItem?.allowedContracts?.map((item) =>
                        item.toString()
                    ) || [],
                allowedgroups:
                    signerItem?.allowedGroups?.map((item) => item.toString()) ||
                    [],
            } as tx.SignerJson;
        });
        let script: string = '';
        try {
            script = sc.createScript(...params.invokeArgs);
        } catch (error) {
            throw {
                type: "SCRIPT_ERROR",
                description: "Script creation error"
            }
        }
        
        /**
         * createTransaction
         */
        async function createTransaction() {
            const currentHeight = await rpcClientTemp.getBlockCount();
            vars.tx = new tx.Transaction({
                signers: params.signers,
                validUntilBlock: currentHeight + 30,
                systemFee: vars.systemFee,
                script
            })
        }

        /**
        * SystemFees 
        */
        async function checkSystemFee() {

            if (params.overrideSystemFee) {
                vars.tx.systemFee = new BigNumber(params.overrideSystemFee).shiftedBy(8).toFixed(0);
            }
            let invokeFunctionResponse = await rpcClientTemp.invokeScript(u.HexString.fromHex(script).toBase64(), signerJson)
            if (invokeFunctionResponse.state !== 'HALT') {
                throw {
                    type: 'rpcError',
                    description: "There was an error when broadcasting this transaction to the network.",
                    error: JSON.stringify(invokeFunctionResponse),
                };
            }
            const requiredSystemFee = new BigNumber(invokeFunctionResponse.gasconsumed).times(1.01).plus(new BigNumber(params.systemFee || 0)).toFixed(0);
            vars.tx.systemFee = u.BigInteger.fromNumber(requiredSystemFee);
        }

        /**
         * Network fees
         */
        async function checkNetworkFee() {
            let txClone: tx.Transaction = vars.tx.export();
            txClone.systemFee = new BigNumber(vars.tx.systemFee).shiftedBy(8).toFixed(0) as any;
            txClone = new tx.Transaction(txClone);
            txClone.sign(neo3This.wif, neo3This.magicNumber);
            
            const fee = await rpcClientTemp.calculateNetworkFee(txClone)
            let networkFee = new BigNumber(fee) + new BigNumber(params.networkFee || 0).toFixed();
            vars.tx.networkFee = u.BigInteger.fromNumber(networkFee);
        }
        await createTransaction();
        try {
            await checkSystemFee();
        } catch (error) {
            throw {
                type: "FAIL",
                description: "check system fee error"
            }
        }
        try {
            await checkNetworkFee();
        } catch (error) {
            throw {
                type: "FAIL",
                description: "check network fee error"
            }
        }
        
        return vars.tx;
    }

    async sendNeo3Tx(txn: tx.Transaction) {
        txn.sign(this.wif, this.magicNumber);
        let signedTx = txn.serialize(true);
        let baseTx1 = Buffer.from(signedTx, 'hex').toString('base64');
        let txHash = await this.rpcClient.sendRawTransaction(baseTx1);
        return txHash;
    }

    async signature(message: string) {
        const privateKey = wallet.getPrivateKeyFromWIF(this.wif);
        const randomSalt = randomBytes(16).toString('hex');
        const publicKey = wallet.getPublicKeyFromPrivateKey(privateKey);
        const parameterHexString = u.str2hexstring(randomSalt + message);
        const lengthHex = u.num2VarInt(parameterHexString.length / 2);
        const concatenatedString = lengthHex + parameterHexString;
        const serializedTransaction = '010001f0' + concatenatedString + '0000';
        const data = {
            publicKey,
            data: wallet.sign(serializedTransaction, privateKey),
            salt: randomSalt,
            message: message,
        };
        return data
    }

    async signTransaction(txn: tx.Transaction) {
        txn.sign(this.wif, this.magicNumber)
        return txn.export()
    }

    createInvokeInputs(data: any) {
        if (data.hasOwnProperty("invocations")) {
            return data.invocations
        } else if (data.hasOwnProperty("operation")) {
            const { args, scriptHash, operation } = data;
            let invocations = [{
                scriptHash,
                operation,
                args: args.map((item) => {
                    if (item && item.type && item.type === 'Address') {
                        return sc.ContractParam.hash160(item.value.toString());
                    } else if (item) {
                        return sc.ContractParam.fromJson(item);
                    } else {
                        return null;
                    }
                }),
            }];
            return invocations
        }
    }

}

