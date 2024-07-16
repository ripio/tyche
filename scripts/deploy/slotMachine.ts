import hre, { ethers } from "hardhat";
import addressUtils from "../../utils/addressUtils";

async function main() {
    const addressList = await addressUtils.getAddressList(hre.network.name);

    console.log({ addressList });

    const SlotMachine = await ethers.getContractFactory('SlotMachine');
    const slotMachine = await SlotMachine.deploy(addressList['NativeVRF']);

    console.log({ slotMachine: slotMachine.address });

    await addressUtils.saveAddresses(hre.network.name, {
        SlotMachine: slotMachine.address,
    });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
