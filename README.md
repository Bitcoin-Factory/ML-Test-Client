# ML-Test-Client
ML-Test-Client

## Setup

First, clone the needed repositories.

```sh
mkdir Bitcoin-Factory
cd Bitcoin-Factory
git clone http://github.com/Bitcoin-Factory/ML-Test-Client
cd ML-Test-Client
git clone http://github.com/Bitcoin-Factory/ML-Test-WebRTC
cd ..
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