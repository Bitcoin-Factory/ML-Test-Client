# ML-Test-Client
ML-Test-Client

This app is used to autonomously test different set of parameters to see which Machine Learnning models can make better predictions.

This is the Client part of a set of system that also has a Server part. The Test Server app manages a set of different Test Cases that needs to be tried out.

Each Test Client app, connects to the Test Server app via webRTC. Once connected, it will enter into an infinite loop requesting new Test Cases to the Test Server.

Once a Test Case is received, the Test Client app will write 2 files at the notebooks folder (which is a shared volume with the Tensor Flow container):

* parameters.CSV
* time-series.CSV

After these files are written, the Test Client App will use the npm package called docker-compose, to execute inside the Tensor Flow container the Bitcoin_Factory_LSTM.py script. 

This script reads boths files, and creates a ML model using the provided parameters and the data at the time-series file. It's execution could take several minutes. Once finished, a set of results are sent back from the Python script to the Test Client app, which in turn send via webRTC the results to the Test Server app, which creates a report at Google Sheets with all the consolidated test results provided by all the Test Clients that contributed running the individual tests.

The Test Client app then wait for 10 seconds and repeat the process again, requesting a new Test Case to test.

## Pre-Requisites

* nodejs
* npm
* git
* docker
* docker-compose

## Setup

First, clone the needed repositories.

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

```sh
cd DockerBuild
docker build -t bitcoin-factory-machine-learning .
cd ..
```

## Usage

First, run the Docker Container.

```sh
docker-compose run bitcoin-factory-machine-learning
```

Second, run the App.

```sh
node runTestClient
```