import { Client, EventType } from "./index"

async function test() {
    // 初始化sdk客户端
    const client = new Client('localhost:18080', '10002')
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
        console.log('license_change_callback data:', data)
    }

    function license_expiring_callback(data: any) {
        console.log('license_expiring_callback data:', data) // { day: 179 }
    }

    function connection_error_callback(data: any){
        console.log("Error connection: ", data)
    }

    // 监听证书变化事件
    client.on(EventType.LicenseChange, license_change_callback)

    // 监听证书即将过期事件
    client.on(EventType.LicenseExpiring, license_expiring_callback) 

    // 监听ws连接异常
    client.on(EventType.ConnectionError, connection_error_callback)
}

test()