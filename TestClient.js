
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

                    let testResult = await buildModel(nextTestCase)

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
                            console.log((new Date()).toISOString(), 'Failed to send a Report to the Test Server with the Test Case Results and get a Reward for that. Err:', err, 'Retrying in 10 seconds...')
                        }
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

        for (let j = 0; j < bestPredictions.length; j++) {
            let bestPrediction = bestPredictions[j]
            let forcastedCandlesFileContent
            let newForcastedCandles = []
            let percentageError = Number(bestPrediction.percentageErrorRMSE)
            let newForcastedCandle = {
                begin: bestPrediction.forcastedCandle.begin,
                end: bestPrediction.forcastedCandle.end,
                open: bestPrediction.forcastedCandle.open,
                min: bestPrediction.predictions[1],
                minPlusError: bestPrediction.predictions[1] + bestPrediction.predictions[1] * percentageError / 100,
                minMinusError: bestPrediction.predictions[1] - bestPrediction.predictions[1] * percentageError / 100,
                max: bestPrediction.predictions[0],
                maxPlusError: bestPrediction.predictions[0] + bestPrediction.predictions[0] * percentageError / 100,
                maxMinusError: bestPrediction.predictions[0] - bestPrediction.predictions[0] * percentageError / 100,
                close: bestPrediction.predictions[2],
                closePlusError: bestPrediction.predictions[2] + bestPrediction.predictions[2] * percentageError / 100,
                closeMinusError: bestPrediction.predictions[2] - bestPrediction.predictions[2] * percentageError / 100
            }
            try {
                /*
                Read Current File from Superalgos Storage
                */
                forcastedCandlesFileContent = fs.readFileSync('D:/Superalgos-Factory/Platform/My-Data-Storage/Project/Data-Mining/Data-Mine/Bitcoin-Factory/Forecasts/binance/' + bestPrediction.mainAsset + '-USDT/Output/Forcasted-Candles/Multi-Time-Frame-Market/' + bestPrediction.mainTimeFrame + '/Data.json')

                let forcastedCandlesFile = JSON.parse(forcastedCandlesFileContent)

                let updated = false

                for (let i = 0; i < forcastedCandlesFile.length; i++) {
                    let forcastedCandleArray = forcastedCandlesFile[i]
                    let forcastedCandle = {
                        begin: forcastedCandleArray[0],
                        end: forcastedCandleArray[1],
                        open: forcastedCandleArray[2],
                        min: forcastedCandleArray[3],
                        minPlusError: forcastedCandleArray[4],
                        minMinusError: forcastedCandleArray[5],
                        max: forcastedCandleArray[6],
                        maxPlusError: forcastedCandleArray[7],
                        maxMinusError: forcastedCandleArray[8],
                        close: forcastedCandleArray[9],
                        closePlusError: forcastedCandleArray[10],
                        closeMinusError: forcastedCandleArray[11]
                    }

                    if (forcastedCandle.begin < bestPrediction.forcastedCandle.begin) {
                        newForcastedCandles.push(forcastedCandle)
                    }
                    if (forcastedCandle.begin === bestPrediction.forcastedCandle.begin) {
                        newForcastedCandles.push(newForcastedCandle)
                        updated = true
                    }
                }
                if (updated === false) {
                    newForcastedCandles.push(newForcastedCandle)
                }
            } catch (err) {
                if (err.code === "ENOENT") {
                    /*
                    If the file does not exist, it is ok, probably this process was never ran before.
                    */
                    newForcastedCandles.push(newForcastedCandle)
                } else {
                    console.log("[ERROR] Cound not update Superalgos. " + err.stack)
                    return
                }
            }
            /*
            Write Updated File into Superalgos Storage
            */
            let newForcastedCandlesFileContent = ""
            newForcastedCandlesFileContent = newForcastedCandlesFileContent + "["
            for (let i = 0; i < newForcastedCandles.length; i++) {
                let newForcastedCandle = newForcastedCandles[i]
                newForcastedCandlesFileContent = newForcastedCandlesFileContent + "["
                newForcastedCandlesFileContent = newForcastedCandlesFileContent + newForcastedCandle.begin
                newForcastedCandlesFileContent = newForcastedCandlesFileContent + ","
                newForcastedCandlesFileContent = newForcastedCandlesFileContent + newForcastedCandle.end
                newForcastedCandlesFileContent = newForcastedCandlesFileContent + ","
                newForcastedCandlesFileContent = newForcastedCandlesFileContent + newForcastedCandle.open
                newForcastedCandlesFileContent = newForcastedCandlesFileContent + ","
                newForcastedCandlesFileContent = newForcastedCandlesFileContent + newForcastedCandle.min
                newForcastedCandlesFileContent = newForcastedCandlesFileContent + ","
                newForcastedCandlesFileContent = newForcastedCandlesFileContent + newForcastedCandle.minPlusError
                newForcastedCandlesFileContent = newForcastedCandlesFileContent + ","
                newForcastedCandlesFileContent = newForcastedCandlesFileContent + newForcastedCandle.minMinusError
                newForcastedCandlesFileContent = newForcastedCandlesFileContent + ","
                newForcastedCandlesFileContent = newForcastedCandlesFileContent + newForcastedCandle.max
                newForcastedCandlesFileContent = newForcastedCandlesFileContent + ","
                newForcastedCandlesFileContent = newForcastedCandlesFileContent + newForcastedCandle.maxPlusError
                newForcastedCandlesFileContent = newForcastedCandlesFileContent + ","
                newForcastedCandlesFileContent = newForcastedCandlesFileContent + newForcastedCandle.maxMinusError
                newForcastedCandlesFileContent = newForcastedCandlesFileContent + ","
                newForcastedCandlesFileContent = newForcastedCandlesFileContent + newForcastedCandle.close
                newForcastedCandlesFileContent = newForcastedCandlesFileContent + ","
                newForcastedCandlesFileContent = newForcastedCandlesFileContent + newForcastedCandle.closePlusError
                newForcastedCandlesFileContent = newForcastedCandlesFileContent + ","
                newForcastedCandlesFileContent = newForcastedCandlesFileContent + newForcastedCandle.closeMinusError
                newForcastedCandlesFileContent = newForcastedCandlesFileContent + "]"
            }
            newForcastedCandlesFileContent = newForcastedCandlesFileContent + "]"
            let filePath = 'D:/Superalgos-Factory/Platform/My-Data-Storage/Project/Data-Mining/Data-Mine/Bitcoin-Factory/Forecasts/binance/' + bestPrediction.mainAsset + '-USDT/Output/Forcasted-Candles/Multi-Time-Frame-Market/' + bestPrediction.mainTimeFrame + '/'
            mkDirByPathSync(filePath)
            fs.writeFileSync(filePath + 'Data.json', newForcastedCandlesFileContent)
        }

        function mkDirByPathSync(targetDir, { isRelativeToScript = false } = {}) {
            /* Function to create folders of missing folders at any path. */
            /* If the directory is not being created, check that you are including a / at the end of the path */
            const path = require("path")

            targetDir = targetDir.substring(0, targetDir.lastIndexOf('/') + 1);

            const sep = '/';
            const initDir = path.isAbsolute(targetDir) ? sep : '';
            const baseDir = isRelativeToScript ? __dirname : '.';

            return targetDir.split(sep).reduce((parentDir, childDir) => {
                const curDir = path.resolve(baseDir, parentDir, childDir);
                try {
                    const fs = require("fs")
                    fs.mkdirSync(curDir);
                } catch (err) {
                    if (err.code === 'EEXIST') { // curDir already exists!
                        return curDir;
                    }

                    // To avoid `EISDIR` error on Mac and `EACCES`-->`ENOENT` and `EPERM` on Windows.
                    if (err.code === 'ENOENT') { // Throw the original parentDir error on curDir `ENOENT` failure.
                        throw new Error(`EACCES: permission denied, mkdir '${parentDir}'`);
                    }

                    const caughtErr = ['EACCES', 'EPERM', 'EISDIR'].indexOf(err.code) > -1;
                    if (!caughtErr || caughtErr && curDir === path.resolve(targetDir)) {
                        throw err; // Throw if it's just the last created dir.
                    }
                }

                return curDir;
            }, initDir);
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