console.clear()
let TEST_CLIENT_INSTANCE_NAME = process.argv[2]
if (TEST_CLIENT_INSTANCE_NAME === undefined) {
    console.log((new Date()).toISOString(), '[ERROR] You need to provide a TEST_CLIENT_INSTANCE_NAME as a parameter to this script.')
    return
}
const TEST_CLIENT_MODULE = require('./TestClient')
const testClient = TEST_CLIENT_MODULE.newMachineLearningTestClient(TEST_CLIENT_INSTANCE_NAME)

testClient.initialize()
setTimeout(testClient.run, 5000)

