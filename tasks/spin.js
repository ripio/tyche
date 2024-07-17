const { task } = require("hardhat/config");

task("spin", "Spin machine")
  .addParam("numSpins", "number of spins")
  .setAction(async (taskArgs, hre) => {
    let [deployer] = await hre.ethers.getSigners();

    // const addressList = await getAddressList(hre.network.name);
    const slotMachineAddress = "0xeC2453BBaaA9d9c9a9A91D152D13d810D7e8efb8";
    console.log("slotMachineAddress", slotMachineAddress);

    const SlotMachine = await ethers.getContractFactory("SlotMachine");
    const slotMachine = SlotMachine.attach(slotMachineAddress);

    const valueForSpin = ethers.utils.parseEther("0.01");
    const value = valueForSpin.mul(taskArgs.numSpins);

    console.log("Spin...");
    const spinTx = await slotMachine
      .connect(deployer)
      .spin(taskArgs.numSpins, { value: value });
    await spinTx.wait(1);
    console.log(`Spin numbers: ${taskArgs.numSpins} , amountDeposit: ${value}`);
  });

module.exports = {};
