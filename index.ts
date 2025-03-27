
const axios = require('axios')
import CryptoJS from 'crypto-js'
import * as nacl from 'tweetnacl'
const WebSocket = require('ws')

type Module = {
    key: string;
    name: string;
    issuedTime: string
    expireTime: string
    extra: string
    childFuncs: any
}

export class Client {
    endPoint: string;
    prodKey: string;
    publicKey = '';
    module?: Module;
    _public_key = '9703919fcd22d32a13bb00fba33a2dd0d35746a597f7c5a4843c567c3482c204';
    constructor(endPoint: string, prodKey: string) {
        this.endPoint = endPoint;
        this.prodKey = prodKey;
    }

    /**
     * 初始化
     */
    async init() {

        const initRes = new InitRes(false, '')
        // 1. 获取公钥
        const res = await this.httpRequest(`http://${this.endPoint}/pubkey?prodkey=${this.prodKey}`)
        if (res.data.code != 200) {
            initRes.msg = res.data.msg;
            return initRes;
        }

        // 2. AES解密返回的数据
        const decryptRes = this.aes_ECB_decrypt(res.data.data, this._public_key.substring(0, 32))
        const decryptResObj = JSON.parse(decryptRes)
        if (decryptResObj.prodKey != this.prodKey) {
            initRes.msg = 'prodkey not match';
            return initRes;
        }
        this.publicKey = decryptResObj.publicKey;

        // 3. 获取权限树
        const modulesResp = await this.httpRequest(`http://${this.endPoint}/modules?prodkey=${this.prodKey}`);
        if (modulesResp.data.code !== 200) {
            initRes.msg = `failed to get modules : ${modulesResp.data.msg}`;
            return initRes;
        }

        try {
            this.module = this.verifyModuleMsg(modulesResp.data.data)
            initRes.result = true

            // websocket监听消息
            this.handleWebSocket()
            return initRes
        } catch (error) {
            initRes.msg = `invalid signature`
            return initRes
        }

    }

    private async httpRequest(url: string) {
        return axios.get(url);
    }

    private handleWebSocket() {
        const ws = new WebSocket(`ws://${this.endPoint}/ws?prodkey=${this.prodKey}`)
        // 连接打开时触发
        ws.on('open', function open() {
            console.log('Connected to the WebSocket server')
            // 这里可以发送消息到服务器
            ws.send('hi server')
        })

        ws.on('message', (data: any) => {
            console.log(`received from websocket server data: ${data}`)
            this.module = this.verifyModuleMsg(JSON.parse(data))
        })

        ws.on('close', () => {
            console.log('Disconnected from the websocket server')
        })

        ws.on('error', (error: any) => {
            console.error(`Websocket Error: ${error}`)
        })
    }

    private verifyModuleMsg(modulesResp: { sign: string; msg: string; }) {
        return this.verifySign(this.publicKey, modulesResp.sign, modulesResp.msg)
    }

    private verifySign(key: string, sign: string, msg: string) {
        // 公钥（必须是Uint8Array或者Buffer格式）
        const publicKey = Buffer.from(key, 'hex');
        
        // 签名（必须是Uint8Array或者Buffer格式）
        const signature = Buffer.from(sign, 'base64');
        
        // 数据（必须是Uint8Array或者Buffer格式）
        const message  = Buffer.from(msg, 'base64');
        const isValid = nacl.sign.detached.verify(message, signature, publicKey)
        if (isValid) {
            console.log('signature is correct!')
            return JSON.parse(message.toString('utf8'))
        } else {
            const msg = 'signature is bad!'
            console.log(msg)
            throw new Error(msg)
        }
    }

    private aes_ECB_decrypt(data: string, secretKey: string) {
        const key = CryptoJS.enc.Utf8.parse(secretKey);
        let decrypt = CryptoJS.AES.decrypt(data, key, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        });
        return CryptoJS.enc.Utf8.stringify(decrypt).toString();
    }

    getModules() {
        return this.module
    }

    getModule(key: string) {
        return this.getModuleByKey(this.module!, key)
    }

    private getModuleByKey(module: Module, key: string) {
        if (!module) {
            return null
        }
        if (key === module.key) {
            return module
        }
        if (!module.childFuncs) {
            return null
        }
        for (const md of module.childFuncs) {
            const ans: any = this.getModuleByKey(md, key)
            if (ans) return ans
        }
        return null
    }

    validate(key: string) {
        const module = this.getModuleByKey(this.module!, key)
        if (!module) return false

        const now = new Date().getTime() / 1000
        if (module.expireTime < now) {
            return false
        }
        if (module.issuedTime > now) {
            return false;
        }
        return true;
    }
}

export class InitRes {
    result: boolean;
    msg: string;

    constructor(result: boolean, msg: string) {
        this.result = result;
        this.msg = msg;
    }
}

