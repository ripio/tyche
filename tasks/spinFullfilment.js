const { task } = require("hardhat/config");

task("fulfill", "fulfill Spin machine")
  .addParam("requestIds", "Ids of the requested spins")
  .setAction(async (taskArgs, hre) => {
    let [deployer] = await hre.ethers.getSigners();

    // const addressList = await getAddressList(hre.network.name);
    const slotMachineAddress = "0xeC2453BBaaA9d9c9a9A91D152D13d810D7e8efb8";
    console.log("slotMachineAddress", slotMachineAddress);

    const SlotMachine = await ethers.getContractFactory("SlotMachine");
    const slotMachine = SlotMachine.attach(slotMachineAddress);

    const requestIds = taskArgs.requestIds.split(","); // Split the input string by commas to form an array
    console.log("Items array:", requestIds);

    console.log("Fullfill...");
    const fulfillSpinTx = await slotMachine
      .connect(deployer)
      .fulfillSpins(requestIds);
    await fulfillSpinTx.wait(1);
    console.log(`fulfillSpinTx: ${fulfillSpinTx.hash}`);
  });

module.exports = {};
