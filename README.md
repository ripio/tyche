# Native VRF

Native VRF applies verifiable random function and simplifies process of participation. It combines on-chain data and random feed from public to generate a random number. In order to secure data feed, Native VRF requires data feeders to generate a valid signature with corresponding random input before publishing it to a blockchain. Each random number needs prior random result as a component. The prior random result is also an input of signatures generated by data feeders. With this data forming, Native VRF provides secure random number generation while keeping simplicity for participants.

This project aims to support random number generation on Ethereum compatible chains natively. Anyone can simply deploy and participate in decentralized random number generation. The system is more secure when there are more number of participants.

## Setup
1. Clone this repository
```shell
git clone https://github.com/Native-VRF/native-vrf.git
```
2. Copy the `.env.example` file and rename to `.env`
```shell
cp .env.example .env
```
3. Set the `PRIVATE_KEY` variable in the `.env` file using your wallet private key
4. Install required packages
```shell
npm i
```

## Deploy Native VRF
Run deploy script
```shell
npx hardhat run scripts/deploy/nativevrf.ts --network <target-network>
```
Example:
```shell
npx hardhat run scripts/deploy/nativevrf.ts --network kubchain_test
```

## Run fulfillder bot
Run fulfiller bot script
```shell
npx hardhat run scripts/examples/fulfill-bot.ts --network <target-network>
```
Example:
```shell
npx hardhat run scripts/examples/fulfill-bot.ts --network kubchain_test
```

## Example of Native VRF consumer
1. Deploy a consumer smart contract
```shell
npx hardhat run scripts/deploy/consumer.ts --network <target-network>
```
2. Run random request
```shell
npx hardhat run scripts/examples/request.ts --network <target-network>
```
3. Run random data record
```shell
npx hardhat run scripts/examples/record.ts --network <target-network>
```