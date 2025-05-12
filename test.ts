import { Client, EventType } from "./index"

async function test() {
    // 初始化sdk客户端
    const client = new Client('http://localhost:18080', 'znjy000', '9703919fcd22d32a13bb00fba33a2dd0d35746a597f7c5a4843c567c3482c204')
    const initRes = await client.init()

    console.log('initRes===', initRes)

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

    const days = client.getRemainingDays()
    console.log('days:', days)

    function license_change_callback(data: any) {
        // 返回结果示例：
        // {
        //     "key": "znjy000",
        //     "name": "智能解译工具",
        //     "issuedTime": 1746547200,
        //     "expireTime": 1751299199,
        //     "extra": "",
        //     "childFuncs": [{
        //         "key": "znjy000.1000",
        //         "name": "智能解译算法",
        //         "issuedTime": 1746547200,
        //         "expireTime": 1751299199,
        //         "extra": "",
        //         "childFuncs": [{
        //             "key": "znjy000.1000.1001",
        //             "name": "建筑物提取",
        //             "issuedTime": 1746547200,
        //             "expireTime": 1751299199,
        //             "extra": "",
        //             "childFuncs": null
        //         }, {
        //             "key": "znjy000.1000.1002",
        //             "name": "水体提取",
        //             "issuedTime": 1746547200,
        //             "expireTime": 1751299199,
        //             "extra": "",
        //             "childFuncs": null
        //         }]
        //     }, {
        //         "key": "znjy000.2000",
        //         "name": "基础算法",
        //         "issuedTime": 1746547200,
        //         "expireTime": 1751299199,
        //         "extra": "",
        //         "childFuncs": [{
        //             "key": "znjy000.2000.2001",
        //             "name": "影像裁剪",
        //             "issuedTime": 1746547200,
        //             "expireTime": 1751299199,
        //             "extra": "",
        //             "childFuncs": null
        //         }, {
        //             "key": "znjy000.2000.2002",
        //             "name": "波段合成",
        //             "issuedTime": 1746547200,
        //             "expireTime": 1751299199,
        //             "extra": "",
        //             "childFuncs": null
        //         }]
        //     }]
        // }
        console.log('license_change_callback data:', JSON.stringify(data)) 
    }

    function license_expiring_callback(data: any) {
        // 返回结果示例 { day: 179 }
        console.log('license_expiring_callback data:', data) 
    }

    // 吊销证书
    function license_revoke_callback(data: any){
        // 返回数据示例：
        // {
        //     "key": "znjy000",
        //     "name": "智能解译工具",
        //     "issuedTime": 1746547200,
        //     "expireTime": 1751299199,
        //     "extra": "",
        //     "childFuncs": [{
        //         "key": "znjy000.1000",
        //         "name": "智能解译算法",
        //         "issuedTime": 1746547200,
        //         "expireTime": 1751299199,
        //         "extra": "",
        //         "childFuncs": [{
        //             "key": "znjy000.1000.1001",
        //             "name": "建筑物提取",
        //             "issuedTime": 1746547200,
        //             "expireTime": 1751299199,
        //             "extra": "",
        //             "childFuncs": null
        //         }, {
        //             "key": "znjy000.1000.1002",
        //             "name": "水体提取",
        //             "issuedTime": 1746547200,
        //             "expireTime": 1751299199,
        //             "extra": "",
        //             "childFuncs": null
        //         }]
        //     }, {
        //         "key": "znjy000.2000",
        //         "name": "基础算法",
        //         "issuedTime": 1746547200,
        //         "expireTime": 1751299199,
        //         "extra": "",
        //         "childFuncs": [{
        //             "key": "znjy000.2000.2001",
        //             "name": "影像裁剪",
        //             "issuedTime": 1746547200,
        //             "expireTime": 1751299199,
        //             "extra": "",
        //             "childFuncs": null
        //         }, {
        //             "key": "znjy000.2000.2002",
        //             "name": "波段合成",
        //             "issuedTime": 1746547200,
        //             "expireTime": 1751299199,
        //             "extra": "",
        //             "childFuncs": null
        //         }]
        //     }]
        // }
        console.log("license_revoke_callback data: ", JSON.stringify(data))
    }

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
}

test()