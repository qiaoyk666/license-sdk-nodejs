import { Client } from "./index"

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
}

test()