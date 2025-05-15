### 概述
标品方成功申请证书后，需要使用SDK校验标品的某些功能模块是否可用，证书中所包含的功能模块，允许用户访问使用，证书中不包含的功能模块，标品方通过SDK校验后，需要进行拦截，不允许使用该功能模块


### SDK使用方法

1 安装
```bash
npm i license-sdk-nodejs
```

### 2 SDK类型说明
```
// SDK初始化结果
class InitRes {
    result: boolean; // 初始化是否成功，true:成功，
    msg: string; // 错误信息
}

// 模块树形结构
type Module = {
    key: string; // 模块key
    name: string; // 模块名称
    issuedTime: number // 生效时间
    expireTime: number // 过期效期
    extra: string
    childFuncs: Array<Module>
}

// 监听事件类型
enum EventType {
    LicenseChange = "license_change", // 证书变化事件，比如证书有效期的变更，权限树的修改等
    ConnectionError = "connection_error", // websocket连接异常事件
    LicenseExpiring = "license_expiring", // 证书即将过期事件
    LicenseRevoke = "license_revoke" // 证书吊销事件，证书吊销后，所有功能模块不可用
}

```

### 3 SDK方法说明
- init(endPoint: string, prodKey: string, secretKey: string) 初始化sdk
	- endPoint: 许可服务地址
	- prodkey: 标品id
	- secretKey: 密钥
- getModules() 获取标品的权限树
- getModule(String key)  获取指定key的权限树
- validate(String key) 校验证书是否有这个key的权限
- getRemainingDays() 获取证书剩余有效期天数


### 4 Client使用
```bash
import { Client } from 'license-sdk-nodejs'

// 初始化sdk客户端
const client = new Client('http://ip:port', 'your prodkey', 'your secret key')
const initRes = await client.init()

if (initRes!.result === false) {
    console.log(`sdk client init failed: ${initRes!.msg}`)
    return
}

console.log(`sdk client init success: ${initRes!.result}`)

// 获取权限树
const modules: Module = client.getModules()
console.log('modules: ', modules)

//  获取指定key的权限树
const module: Module = client.getModule('10002.10002')
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
function license_change_callback(data: Module) {
    console.log('license_change_callback data:', data)
}

// 证书将近过期回调函数
function license_expiring_callback(data: any) {
    // 返回结果示例 { day: 16 }
    console.log('license_expiring_callback data:', data)
}

// 吊销证书
function license_revoke_callback(data: Module){
    console.log("license_revoke_callback data: ", data)
}

// websocket连接异常回调函数
function connection_error_callback(data: any){
    // 返回数据示例：
    // Error: connect ECONNREFUSED ::1:18080
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