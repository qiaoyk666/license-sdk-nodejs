### 使用方法

1 安装
```bash
npm i license-sdk-nodejs
```

2 Client使用
```bash
import { Client } from 'license-sdk-nodejs'

// 初始化sdk客户端
const client = new Client('localhost:18080', '10002')
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
module = client.getModule('10002.10002')
console.log("module: ", module)

//  校验指定key是否有权限
const key = '10002.10002'
const isOk = client.validate(key) // true or false
if (isOk) {
    console.log(`key: ${key} has permission`)
} else {
    console.log(`key: ${key} has no permission`)
}
```