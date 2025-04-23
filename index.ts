
const axios = require('axios')
import CryptoJS from 'crypto-js'
import * as nacl from 'tweetnacl'
const WebSocket = require('ws')

type Module = {
    key: string;
    name: string;
    issuedTime: number
    expireTime: number
    extra: string
    childFuncs: any
}

export enum EventType {
    LicenseChange = "license_change",
    ConnectionError = "connection_error",
    LicenseExpiring = "license_expiring"
}

export enum WsMsgType {
    WsMsgTypePermissionTree = 1,
    WsMsgTypeExpireWarning = 2
}

export class Client {
    endPoint: string;
    prodKey: string;
    publicKey = '';
    module?: Module;
    _public_key = '9703919fcd22d32a13bb00fba33a2dd0d35746a597f7c5a4843c567c3482c204';
    eventCallbacks: Map<EventType, any[]> = new Map()
    constructor(endPoint: string, prodKey: string) {
        this.endPoint = endPoint;
        this.prodKey = prodKey;
        this.eventCallbacks.set(EventType.ConnectionError, [])
        this.eventCallbacks.set(EventType.LicenseChange, [])
        this.eventCallbacks.set(EventType.LicenseExpiring, [])
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
            const dataObj = JSON.parse(data)
            switch(dataObj.msgType){
                case WsMsgType.WsMsgTypePermissionTree:
                    this.module = this.verifyModuleMsg(dataObj)
                    this.emit(EventType.LicenseChange, this.module)
                    break;
                case WsMsgType.WsMsgTypeExpireWarning:

                    // 数据（必须是Uint8Array或者Buffer格式）
                    // const message  = Buffer.from(dataObj.msg, 'base64');
                    const message = this.base64ToUint8Array(dataObj.msg)
                    const decoder = new TextDecoder();
                    const decodedString = decoder.decode(message);
                    const messageObj = JSON.parse(decodedString)
                    this.emit(EventType.LicenseExpiring, messageObj)
                    break;

            }
        })

        ws.on('close', () => {
            console.log('Disconnected from the websocket server')
        })

        ws.on('error', (error: any) => {
            console.error(`Websocket Error: ${error}`)
        })
    }

    private emit(event: EventType, data: any) {
        const callbacks = this.eventCallbacks.get(event)
        for (const callback of callbacks!) {
            callback(data)
        }
    }

    public on(event: EventType, callback: any) {
        this.eventCallbacks.get(event)!.push(callback)
    }

    private verifyModuleMsg(modulesResp: { sign: string; msg: string; }) {
        return this.verifySign(this.publicKey, modulesResp.sign, modulesResp.msg)
    }

    private verifySign(key: string, sign: string, msg: string) {
        // // 公钥（必须是Uint8Array或者Buffer格式）
        // const publicKey = Buffer.from(key, 'hex');
        
        // // 签名（必须是Uint8Array或者Buffer格式）
        // const signature = Buffer.from(sign, 'base64');
        
        // // 数据（必须是Uint8Array或者Buffer格式）
        // const message  = Buffer.from(msg, 'base64');
         // 公钥（必须是Uint8Array或者Buffer格式）
        //  const publicKey = Buffer.from(key, 'hex');
         const publicKey = this.hexStringToByteArray(key)
        
         // 签名（必须是Uint8Array或者Buffer格式）
         const signature = this.base64ToUint8Array(sign);
         
         // 数据（必须是Uint8Array或者Buffer格式）
         const message  = this.base64ToUint8Array(msg);
        const isValid = nacl.sign.detached.verify(message, signature, publicKey)
        if (isValid) {
            console.log('signature is correct!')
            // return JSON.parse(message.toString('utf8'))
            const decoder = new TextDecoder();
            const decodedString = decoder.decode(message);
            return JSON.parse(decodedString)
        } else {
            const msg = 'signature is bad!'
            console.log(msg)
            throw new Error(msg)
        }
    }

    private base64ToUint8Array(base64: string) {
        // 去掉base64字符串中的空格、换行符等
        base64 = base64.replace(/[\t\n\f\r ]+/g, '');
        
        // 使用atob函数进行解码，得到UTF-8编码的字符串
        let binaryString = atob(base64);
        
        // 创建一个空的Uint8Array，长度为解码后的字符串长度
        let len = binaryString.length;
        let bytes = new Uint8Array(len);
        
        // 将解码后的字符串的每个字符的ASCII码值赋给Uint8Array的对应位置
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        return bytes;
    }

    
    private hexStringToByteArray(hexString: string) {
        const byteArray = [];
        for (let i = 0; i < hexString.length; i += 2) {
            // 将每两个字符解析为一个十六进制数，并将其转换为十进制数添加到字节数组中
            byteArray.push(parseInt(hexString.substring(i, i+2), 16));
        }
        return new Uint8Array(byteArray);
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

    getRemainingDays() :number {
        return Math.ceil((this.module!.expireTime - new Date().getTime()/1000) / 3600 / 24)
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

