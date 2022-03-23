# ML-Test-Client

## Introduction

### Why do we need this?

When working with Machine Learning models, soon you realize that even though they could work to make financial forecasts, you need to set a whole array of parameters that not only define the architecture of the model, but also the shape of the data and may other things. For each of these parameters, there is a valid range of values that could work, but only in combination with other parameters which also have their own valid ranges.

Nobody knows what combination is going to produce the best results. For this kind of problems, the results are measured by the error measured of the forecasts that a trained model can proviede, compared with the actual values. In order to obtain the error measure, first a ML model with certain parameters and certain data need to be created and trained, which usually takes time. 

Testing combinations of parameters and data (with potentially hundreds of indicators to choose from, thousands of crypto assets, and dozens of time-frames) by hand, would be a nightmare. This system solves that problems by automating the discovery of the best performing ML models, for a certain range of parameters values and certain set of indicators. 

It allows us to define for each parameter a range of valid values, creating a set of Test Cases based on all the possible combinations of all the values inside the valid  ranges for all parameters. Then we only need distributed processing power to test all the combinations in a reasonable time and find which parameters / data configurations produces the best results. Best results means the best forecasts in crypto markets.

Over time, we will learn how to trim those ranges so that finally we need to search for the best performing models at a narrower space. At a production environment we will be forever testing since datasets are changing over time. 

It is important to understand that this APP does not prepare the dataset to be tested. This is done by the Test Server App. That means that this app does not need to be ran together with Superalgos or any other data provider. It only depends on the Test Server which handles the management of the Test Cases and the generation of the datasets to be used at each one of the tests.

### Example of Parameters

* PARAMETER   VALUE
* LIST_OF_ASSETS   BTC   ETH
* LIST_OF_TIMEFRAMES   24-hs   12-Hs
* NUMBER_OF_INDICATORS_PROPERTIES   5
* NUMBER_OF_LAG_TIMESTEPS   8
* NUMBER_OF_ASSETS   1
* NUMBER_OF_LABELS   2
* PERCENTAGE_OF_DATASET_FOR_TRAINING   80
* NUMBER_OF_FEATURES   5
* NUMBER_OF_EPOCHS   10
* NUMBER_OF_LSTM_NEURONS   50

### Example of Dataset

* Timestamp   BTC-candle.max-24-hs-1   BTC-candle.min-24-hs-1   BTC-candle.open-24-hs-1   BTC-candle.close-24-hs-1   BTC-volume.total-24-hs-1
* 1503014400000   4371.52   3938.77   4285.08   4108.37   1199.8882639999993
* 1503100800000   4184.69   3850   4108.37   4139.98   381.3097630000001
* 1503187200000   4211.08   4032.62   4139.98   4086.29   467.0830220000002
* 1503273600000   4119.62   3911.79   4069.13   4016   691.7430599999999
* 1503360000000   4104.82   3400   4016   4040   966.6848579999996
* 1503446400000   4265.8   4013.89   4040   4114.01   1001.136565
* 1503532800000   4371.68   4085.01   4147   4316.01   787.4187530000003
* 1503619200000   4453.91   4247.48   4316.01   4280.68   573.6127399999996
* 1503705600000   4367   4212.41   4280.68   4337.44   228.10806799999992
* 1503792000000   4400   4285.54   4332.51   4310.01   350.6925850000002
* 1503878400000   4399.82   4124.54   4310.01   4386.69   603.8416160000002

### How does this App work?

This app is used to autonomously test different set of parameters to see which Machine Learnning models can make better forecasts.

This is the Client part of a system that also has a Server part. The Test Server app manages a set of different Test Cases that needs to be tried out.

Each Test Client app, connects to the Test Server app via webRTC. Once connected, it will enter into an infinite loop requesting new Test Cases to the Test Server.

Once a Test Case is received, the Test Client app will write 2 files at the notebooks folder (which is a shared volume with the Tensor Flow container):

* parameters.CSV
* time-series.CSV

After these files are written, the Test Client App will execute inside the Tensor Flow container the Bitcoin_Factory_LSTM.py script. 

This script reads boths files, and creates a ML model using the provided parameters and the data at the time-series file. It's execution could take several minutes. Once finished, a set of results are sent back from the Python script to the Test Client app, which in turn sends via webRTC the results to the Test Server app. This app creates a report with the best forecasts from all the Test Clients participating testing different sets of parameters. 

This consolidated report with the best crowd-sourced forecasts is sent back to each Test Client as a response to their own report with the results of their latest test.  

The Test Client app once it receives this report, it saves as a Superalgos indicator under the Bitcoin-Factory Data Mine all the crowdsourced forecasts received.

The Test Client app then wait for 10 seconds and repeat the process again, requesting a new Test Case to test.

### Should I leave this App Running?

Yes, if you want to be receiving the crowd-sourced forecasts over time. Each new hour, the Test Server runs again the same set of tests, so that new forecasts can be obtained for relevant time-frames at that moment in time. 

If you have this app running, you will be collecting all these forecasts and building over time historical dataset with the forecasts received. That could later be used for backtesting strategies which relies on these forecasts. 

If you already have a strategy that uses forcasts and you want to live trade with it, then you will need at least one Test Client App running to receive updated forecasts over time. If you run more than one Test Client at the same time, chances are that you will be updated with these forecasts more often, since the crowd-sourced forcasts are received after each test you make (which might take several minutes), having more than one app doing tests increases the frequency in which you get new forecasts.

NOTE: At the current version the Server is not running the same tests every hour, but some big set of tests that might take days to complete. Also the data used might not be up-to-date. The reason for this is because this app is still under development.

### How do we know which are the best Forecasts?

Each tested models (created based on a set of parameters and a dataset) has a certain implied Error: the root-mean-square error (RMSE).

https://en.wikipedia.org/wiki/Root-mean-square_deviation

The whole point of crowd-testing is to find the model with the lowest % of error for a certain Asset/Time-Frame. (All forecasts are done at the Asset/USDT markets on Binance for now.)

When you are running this App, you are testing certain combinations of parameters for a certain Asset/Time-Frame including a custom dataset for your specific test, which might include a certain combination of indicators data.

The crowd-sourced forecasts you receive after each test, are the ones belonging to ML models with the lowest % error for a certain Asset/Time-Frame.

### Scalability

Since the Test Client and Test Server interact in a p2p way via webRTC, that means that we can run a Test Server at home and get help to process Test Cases from anywhere in the world without the need to pay for cloud servers, and without limits regarding the amount of people that can help.


## Pre-Requisites

* nodejs
* npm
* git
* docker

## Your-Test-Client-Id

To run this software you need to get an Id for your Test Client. 

## Setup

### Repositories Cloning 

Clone the needed repositories.

```sh
mkdir Bitcoin-Factory
cd Bitcoin-Factory
git clone http://github.com/Bitcoin-Factory/ML-Test-Client
cd ML-Test-Client
git clone http://github.com/Bitcoin-Factory/ML-Test-WebRTC
cd ..
npm install node-pre-gyp
npm update
```

Second, build the Docker Image.

### On x86 Processors

```sh
cd DockerBuild
docker build -t bitcoin-factory-machine-learning .
cd ..
```

### On xArm Processors

```sh
cd ArmDockerBuild
docker build -t bitcoin-factory-machine-learning .
cd ..
```

IMPORTANT NOTE: You need to have a 64 bit version of your OS, otherwise this is not going to work.

## Usage

Run the Docker Container:

### on Windows

Run the container with this commnad. Change the path if you did not install this App at the commands location.

```sh
docker run -it --rm --name Bitcoin-Factory-ML -v C:/Bitcoin-Factory/ML-Test-Client/notebooks:/tf/notebooks -p 8888:8888 bitcoin-factory-machine-learning
```

Run the App:

```sh
node runTestClient Your-Test-Client-Id
```

### on Ubuntu Server

Run the Docker Container:

```sh
sudo docker run -it --rm --name Bitcoin-Factory-ML -v ~/Bitcoin-Factory/ML-Test-Client/notebooks:/tf/notebooks -p 8888:8888 bitcoin-fac
tory-machine-learning
```

```sh
sudo node runTestClient Your-Test-Client-Id
```

## on Mac OS

### File Sharing

Before running that command for the first time, you will need to share the notebooks folder.

At the Settings of the Docker App, use File sharing to allow local directories on the Mac to be shared with Linux containers. By default the /Users, /Volume, /private, /tmp and /var/folders directory are shared. As this project is outside this directory then it must be added to the list. Otherwise you may get Mounts denied or cannot start service errors at runtime.

### File Share Settings

To add the 'notebooks' Directory: Click + and navigate to the 'notebooks' directory.

Apply & Restart makes the directory available to containers using Docker’s bind mount (-v) feature.

### Run the Container & the App

The command to run the container on Mac should be like this (mind Your-User-Name).

```sh
docker run -it --rm --name Bitcoin-Factory-ML -v /Users/Your-User-Name/Bitcoin-Factory/ML-Test-Client/notebooks:/tf/notebooks -p 8888:8888 bitcoin-factory-machine-learning
```

Run the App:

```sh
node runTestClient Your-Test-Client-Id
```

## On Raspbian

Early test on Raspbian has shown difficulties to build the docker image. If you manage to make it work with this OS please report back so that we update the specific instructions for it.

## Upgrade

The procedure to upgrade this App is the following: Open a Terminal at the ML-Test-Client folder. The you need to pull again the app repository and the WebRTC repository.

```sh
git pull
cd ML-Test-WebRTC
git pull
```

## Environmet Settings

There is an Environment.json file with settings you can adjust. As of today the only setting is the path to your Superalgos installation.

```sh
{
    "PATH_TO_SUPERALGOS": "C:/Superalgos"
}
```

This app will use this path to save the best crowd-sourced forecasts as an Indicator in Superalgos, that you can consume via the Bitcoin-Factory Data Mine.

## Troubleshooting - Docker Cheat Sheet

If you get the error:

```sh
docker: Error response from daemon: Conflict. The container name "/Bitcoin-Factory-ML" is already in use by container ...
```

Use the command

```sh
docker container prune
```

to fix it.