let testClientId = process.argv[2]
if (testClientId === undefined) {
    console.log('[ERROR] You need to provide this Test Client Id as a parameter to this script.')
    return
} 

const TEST_CLIENT_MODULE = require('./TestClient')
const testClient = TEST_CLIENT_MODULE.newMachineLearningTestClient()

testClient.initialize(testClientId)
setTimeout(testClient.run, 1000)

