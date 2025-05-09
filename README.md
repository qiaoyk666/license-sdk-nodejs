### 使用方法

1 安装
```bash
npm i license-sdk-nodejs
```

2 Client使用
```bash
import { Client } from 'license-sdk-nodejs'

// 初始化sdk客户端
const client = new Client('http://localhost:18080', 'znjy000', 'your secret key')
const initRes = await client.init()

if (initRes!.result === false) {
    console.log(`sdk client init failed: ${initRes!.msg}`)
    return
}

console.log(`sdk client init success: ${initRes!.result}`)

// 获取权限树
const modules = client.getModules()
console.log('modules: ', modules)

//  获取指定key的权限树
const module = client.getModule('10002.10002')
console.log("module: ", module)

//  校验指定key是否有权限
const key = '10002.10002'
const isOk = client.validate(key) // true or false
if (isOk) {
    console.log(`key: ${key} has permission`)
} else {
    console.log(`key: ${key} has no permission`)
}

// 证书剩余有效期天数
const days = client.getRemainingDays()
console.log('证书剩余有效期天数:', days)

// 证书变化回调函数
function license_change_callback(data: any) {
    console.log('license_change_callback data:', data)
}

// 证书将近过期回调函数
function license_expiring_callback(data: any) {
    console.log('license_expiring_callback data:', data) // { day: 179 }
}

// 吊销证书
function license_revoke_callback(data: any){
    console.log("license_revoke_callback data: ", data)
}

// websocket连接异常回调函数
function connection_error_callback(data: any){
    console.log("Error connection: ", data)
}

// 监听证书变化事件
client.on(EventType.LicenseChange, license_change_callback)

// 监听证书即将过期事件
client.on(EventType.LicenseExpiring, license_expiring_callback) 

// 监听吊销证书事件
client.on(EventType.LicenseRevoke, license_revoke_callback)

// 监听ws连接异常
client.on(EventType.ConnectionError, connection_error_callback)
```