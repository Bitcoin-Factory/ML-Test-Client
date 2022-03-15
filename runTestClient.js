const TEST_CLIENT_MODULE = require('./TestClient')
const testClient = TEST_CLIENT_MODULE.newMachineLearningTestClient()

testClient.initialize()
testClient.run()

