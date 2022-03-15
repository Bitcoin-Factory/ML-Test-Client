
exports.newMachineLearningTestClient = function newMachineLearningTestClient() {
    /*
    This modules bring the data from indicators into a time-series that can be feed to a Machine Learning Model.
    */
    let thisObject = {
        run: run,
        initialize: initialize,
        finalize: finalize
    }
    const fs = require("fs")
    const compose = require('docker-compose')
    const bestParameters = {
        errorRMSE: undefined,
        predictions: undefined,
        parameters: undefined
    }
    const WEBRTC_MODULE = require('./ML-Test-WebRTC/WebRTC')
    const WEBRTC = WEBRTC_MODULE.newMachineLearningWebRTC()

    return thisObject

    function initialize() {
        WEBRTC.initialize()
    }

    function finalize() {

    }

    async function run() {
        while (true) {
            let nextTestCase = await getNextTestCase()

            if (nextTestCase !== undefined) {
                fs.writeFileSync("./notebooks/parameters.CSV", nextTestCase.files.parameters)
                fs.writeFileSync("./notebooks/time-series.CSV", nextTestCase.files.timeSeries)

                let testResult = await buildModel(nextTestCase)

                if (testResult !== undefined) {
                    testResult.id = nextTestCase.id
                    let reward = await setTestCaseResults(testResult)
                    console.log(reward)
                }
            } else {
                console.log('Nothing to Test at: ', (new Date()).toISOString())
            }
            await sleep(10000)
        }
    }

    async function getNextTestCase() {
        return new Promise(promiseWork)

        async function promiseWork(resolve, reject) {
            /*
            Because of the size limitations of web RTC for messages at a data channel,
            we will receive an array of responses which contains the nextTestCase object
            and the parameters and timeseries files as different items of the array.
            We will assamble all together again here.
            */
            let message = {
                type: 'Get Next Test Case'
            }
            let response = await WEBRTC.sendMessage(JSON.stringify(message))
            if (response !== 'NO TEST CASES AVAILABLE AT THE MOMENT') {
                let nextTestCase = JSON.parse(response[2])
                nextTestCase.files.timeSeries = response[0]
                nextTestCase.files.parameters = response[1]
                resolve(nextTestCase)
            } else {
                console.log('Nothing to Test at: ', (new Date()).toISOString())
            }
        }
    }

    async function setTestCaseResults(testResult) {
        return new Promise(promiseWork)

        async function promiseWork(resolve, reject) {
            let message = {
                type: 'Set Test Case Results',
                payload: JSON.stringify(testResult)
            }
            let response = await WEBRTC.sendMessage(JSON.stringify(message))
            resolve(response)
        }
    }

    async function buildModel(nextTestCase) {
        console.log('')
        console.log('-------------------------------------------------------- Test Case # ' + nextTestCase.id + ' / ' + nextTestCase.totalCases + ' --------------------------------------------------------')
        console.log('')
        console.table(nextTestCase.parameters)
        console.log('')
        console.log('GMT Datetime: ', (new Date()).toISOString())
        let processExecutionResult
        let startingTimestamp = (new Date()).valueOf()
        return new Promise(promiseWork)

        async function promiseWork(resolve, reject) {
            await compose.exec('bitcoin-factory-machine-learning', 'python /tf/notebooks/Bitcoin_Factory_LSTM.py')
                .catch(onError)
                .then(onFinished)

            function onError(err) {
                console.log('[ERROR] Error Building Model. Error received from Docker Compose: ' + JSON.stringify(err))
            }

            function onFinished(processCallResult) {
                try {
                    console.log('Exit Code: ' + processCallResult.exitCode)
                    // console.log('Output:' + processCallResult.out)
                    /*
                    Removing Carriedge Return from string.
                    */
                    for (let i = 0; i < 10000; i++) {
                        processCallResult.out = processCallResult.out.replace(/\n/, "")
                    }
                    processExecutionResult = JSON.parse(processCallResult.out)

                    processExecutionResult.predictions = fixJSON(processExecutionResult.predictions)
                    processExecutionResult.actualValues = fixJSON(processExecutionResult.actualValues)
                    processExecutionResult.difference = fixJSON(processExecutionResult.difference)

                    processExecutionResult.predictions = JSON.parse(processExecutionResult.predictions)
                    processExecutionResult.actualValues = JSON.parse(processExecutionResult.actualValues)
                    processExecutionResult.difference = JSON.parse(processExecutionResult.difference)

                    console.log('Prediction RMSE Error: ' + processExecutionResult.errorRMSE)
                    console.log('Predictions: ' + processExecutionResult.predictions)
                    console.log('Actual Values: ' + processExecutionResult.actualValues)
                    console.log('Differences: ' + processExecutionResult.difference)

                    let endingTimestamp = (new Date()).valueOf()
                    processExecutionResult.enlapsedTime = (endingTimestamp - startingTimestamp) / 1000
                    console.log('Enlapsed Time (HH:MM:SS): ' + (new Date(processExecutionResult.enlapsedTime * 1000).toISOString().substr(14, 5)) + ' ')

                    if (bestParameters.errorRMSE === undefined) {
                        bestParameters.errorRMSE = processExecutionResult.errorRMSE
                        bestParameters.predictions = processExecutionResult.predictions
                        bestParameters.actualValues = processExecutionResult.actualValues
                        bestParameters.difference = processExecutionResult.difference
                        bestParameters.parameters = nextTestCase.parameters
                    }

                    if (processExecutionResult.errorRMSE < bestParameters.errorRMSE) {
                        bestParameters.errorRMSE = processExecutionResult.errorRMSE
                        bestParameters.predictions = processExecutionResult.predictions
                        bestParameters.actualValues = processExecutionResult.actualValues
                        bestParameters.difference = processExecutionResult.difference
                        bestParameters.parameters = nextTestCase.parameters
                    }
                    console.log('')
                    console.log('Best Error: ' + bestParameters.errorRMSE)
                    console.log('Best Predictions: ' + bestParameters.predictions)
                    console.log('Best Actual Values: ' + bestParameters.actualValues)
                    console.log('Best Differences: ' + bestParameters.difference)
                    console.log('Current Best Set of Parameters: ')
                    console.log('')
                    console.table(bestParameters.parameters)
                    console.log('')

                } catch (err) {
                    if (processCallResult !== undefined) {
                        console.log('Output:' + processCallResult.out)
                        if (processExecutionResult !== undefined && processExecutionResult.predictions !== undefined) {
                            console.log('processExecutionResult.predictions:' + processExecutionResult.predictions)
                        }
                    } else {
                        console.log('processCallResult:' + processCallResult)
                    }

                    console.log(err.stack)
                    console.error(err)
                }

                resolve(processExecutionResult)
            }
        }
    }

    function sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms)
        })
    }

    function fixJSON(text) {
        /*
        Removing Carriedge Return from string.
        */
        text = text.replace(" [", "[")
        text = text.replace(" ]", "]")
        text = text.replace("  ]", "]")
        text = text.replace("   ]", "]")
        text = text.replace("    ]", "]")
        text = text.replace("     ]", "]")
        text = text.replace("      ]", "]")
        text = text.replace("] ", "]")

        for (let i = 0; i < 100; i++) {
            text = text.replace("  ", ",")
        }
        for (let i = 0; i < 100; i++) {
            text = text.replace(" ", ",")
        }
        text = text.replace(",,", ",")
        text = text.replace(",]", "]")
        text = text.replace("[,", "[")
        text = text.replace(".,", ",")

        return text
    }
}