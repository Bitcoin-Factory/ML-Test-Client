
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
    const WEBRTC_MODULE = require('./ML-Test-WebRTC/WebRTC')
    const WEBRTC = WEBRTC_MODULE.newMachineLearningWebRTC()

    const ENVIRONMENT = require("./Environment")

    return thisObject

    function initialize(testClientId) {
        WEBRTC.initialize(testClientId)
    }

    function finalize() {

    }

    async function run() {
        while (true) {
            await getNextTestCase()
                .then(onSuccess)
                .catch(onError)
            async function onSuccess(nextTestCase) {
                if (nextTestCase !== undefined) {
                    fs.writeFileSync("./notebooks/parameters.csv", nextTestCase.files.parameters)
                    fs.writeFileSync("./notebooks/time-series.csv", nextTestCase.files.timeSeries)

                    await buildModel(nextTestCase)
                        .then(onSuccess)
                        .catch(onError)

                    async function onSuccess(testResult) {
                        if (testResult !== undefined) {
                            testResult.id = nextTestCase.id
                            await setTestCaseResults(testResult)
                                .then(onSuccess)
                                .catch(onError)
                            async function onSuccess(response) {
                                let bestPredictions = JSON.parse(response)
                                console.log(' ')
                                console.log('Best Crowd-Sourced Predictions:')
                                console.table(bestPredictions)
                                updateSuperalgos(bestPredictions)
                            }
                            async function onError(err) {
                                console.log((new Date()).toISOString(), 'Failed to send a Report to the Test Server with the Test Case Results and get a Reward for that. Err:', err, 'Aborting the processing of this case and retrying the main loop in 10 seconds...')
                            }
                        }
                    }

                    async function onError(err) {
                        console.log((new Date()).toISOString(), 'Failed to Build the Model for this Test Case. Err:', err, 'Aborting the processing of this case and retrying the main loop in 10 seconds...')
                        await sleep(10000)
                    }
                } else {
                    console.log((new Date()).toISOString(), 'Nothing to Test', 'Retrying in 10 seconds...')
                }
                await sleep(10000)
            }
            async function onError(err) {
                console.log((new Date()).toISOString(), 'Failed to get a Test Case. Err:', err, 'Retrying in 10 seconds...')
                await sleep(10000)
            }
        }
    }

    function updateSuperalgos(bestPredictions) {

        let params = {
            method: 'updateForecastedCandles',
            forcastedCandles: JSON.stringify(bestPredictions)
        }

        const axios = require("axios")
        axios
            .post('http://' + ENVIRONMENT.SUPERALGOS_HOST + ':' + ENVIRONMENT.SUPERALGOS_HTTP_PORT + '/Bitcoin-Factory', params)
            .then(res => {
                console.log((new Date()).toISOString(), 'Updating Superalgos', 'Response from Superalgos Bitcoin Factory Server: ' + JSON.stringify(res.data))
            })
            .catch(error => {
                console.log((new Date()).toISOString(), 'Updating Superalgos', 'Could not update Superalgos. Had this error: ' + error)
            })
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
            await WEBRTC.sendMessage(JSON.stringify(message))
                .then(onSuccess)
                .catch(onError)
            async function onSuccess(response) {
                if (response !== 'NO TEST CASES AVAILABLE AT THE MOMENT') {
                    let nextTestCase = JSON.parse(response[2])
                    nextTestCase.files.timeSeries = response[0]
                    nextTestCase.files.parameters = response[1]
                    resolve(nextTestCase)
                } else {
                    reject('No more test cases at the Test Server')
                }
            }
            async function onError(err) {
                reject(err)
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
            await WEBRTC.sendMessage(JSON.stringify(message))
                .then(onSuccess)
                .catch(onError)
            async function onSuccess(response) {
                resolve(response)
            }
            async function onError(err) {
                reject(err)
            }
        }
    }

    async function buildModel(nextTestCase) {
        console.log('')
        console.log('-------------------------------------------------------- Test Case # ' + nextTestCase.id + ' / ' + nextTestCase.totalCases + ' --------------------------------------------------------')
        console.log('')
        console.log('Starting at this GMT Datetime: ', (new Date()).toISOString())
        console.log('')
        console.log('Parameters Received for this Test:')
        console.table(nextTestCase.parameters)
        console.log('')

        let processExecutionResult
        let startingTimestamp = (new Date()).valueOf()
        return new Promise(promiseWork)

        async function promiseWork(resolve, reject) {

            const { spawn } = require('child_process');
            const ls = spawn('docker', ['exec', 'Bitcoin-Factory-ML', 'python', '/tf/notebooks/Bitcoin_Factory_LSTM.py']);
            let dataReceived = ''
            ls.stdout.on('data', (data) => {
                data = data.toString()
                /*
                Removing Carriedge Return from string.
                */
                for (let i = 0; i < 1000; i++) {
                    data = data.replace(/\n/, "")
                }
                dataReceived = dataReceived + data.toString()
            });

            ls.stderr.on('data', (data) => {
                onError(data)
            });

            ls.on('close', (code) => {
                console.log(`Docker Python Script exited with code ${code}`);
                if (code === 0) {
                    onFinished(dataReceived)
                } else {
                    console.log('[ERROR] Unexpected error trying to execute a Python script inside the Docker container. ')
                    console.log('[ERROR] Check at a console if you can run this command: ')
                    console.log('[ERROR] docker exec -it Bitcoin-Factory-ML python /tf/notebooks/Bitcoin_Factory_LSTM.py')
                    console.log('[ERROR] Once you can sucessfully run it at the console you might want to try to run this App again. ')
                    reject('Unexpected Error.')
                }
            });

            function onError(err) {
                err = err.toString()
                //reject('Error Building Model.')
            }

            function onFinished(dataReceived) {
                try {

                    processExecutionResult = JSON.parse(dataReceived)
                    processExecutionResult.predictions = fixJSON(processExecutionResult.predictions)
                    processExecutionResult.predictions = JSON.parse(processExecutionResult.predictions)

                    console.log('Prediction RMSE Error: ' + processExecutionResult.errorRMSE)
                    console.log('Predictions [candle.max, candle.min, candle.close]: ' + processExecutionResult.predictions)

                    let endingTimestamp = (new Date()).valueOf()
                    processExecutionResult.enlapsedTime = (endingTimestamp - startingTimestamp) / 1000
                    console.log('Enlapsed Time (HH:MM:SS): ' + (new Date(processExecutionResult.enlapsedTime * 1000).toISOString().substr(14, 5)) + ' ')

                } catch (err) {

                    if (processExecutionResult !== undefined && processExecutionResult.predictions !== undefined) {
                        console.log('processExecutionResult.predictions:' + processExecutionResult.predictions)
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
        for (let i = 0; i < 10; i++) {
            text = text.replace(" [", "[")
            text = text.replace(" ]", "]")
            text = text.replace("  ]", "]")
            text = text.replace("   ]", "]")
            text = text.replace("    ]", "]")
            text = text.replace("     ]", "]")
            text = text.replace("      ]", "]")
            text = text.replace("] ", "]")
        }
        for (let i = 0; i < 100; i++) {
            text = text.replace("  ", ",")
        }
        for (let i = 0; i < 100; i++) {
            text = text.replace(" ", ",")
        }
        for (let i = 0; i < 10; i++) {
            text = text.replace(",,", ",")
            text = text.replace(",]", "]")
            text = text.replace("[,", "[")
            text = text.replace(".,", ",")
            text = text.replace(".]", "]")
        }
        return text
    }
}