import { ethers } from "hardhat";
import { expect } from "chai";
import { SlotMachine, NativeVRF } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {calculateRandomInput, decordOutputs} from "../scripts/examples/fulfill-bot";
import { BigNumber } from "ethers";

const fullfillRandomness = async (requestId: BigNumber, signer: SignerWithAddress, nativeVRF: NativeVRF) => {
    try {

      const { input, signature } = await calculateRandomInput(
          signer,
          nativeVRF,
          requestId.toString(),
      );

      const tx = await nativeVRF.fullfillRandomness([requestId], [input], [signature]);

      console.log("Submit fulfill transaction");

      const receipt = await tx.wait();

      console.log("Fulfll randomness successfully");
      console.log("Data: ", decordOutputs(receipt));
    } catch (e) {
      console.error("Error fulfill randomness", e);
    }
}


describe("SlotMachine", function () {
  let slotMachine: SlotMachine;
  let nativeVRF: NativeVRF;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const NativeVRFFactory = await ethers.getContractFactory("NativeVRF");
    nativeVRF = (await NativeVRFFactory.deploy(ethers.utils.parseEther("1"))) as NativeVRF;
    await nativeVRF.deployed();

    const SlotMachineFactory = await ethers.getContractFactory("SlotMachine");
    slotMachine = (await SlotMachineFactory.deploy(nativeVRF.address)) as SlotMachine;  
    await slotMachine.deployed();
    // send ether to slotMachine
    await owner.sendTransaction({
      to: slotMachine.address,
      value: ethers.utils.parseEther("1")
    });
  });

  // describe("Deployment", function () {
  //   it("Should set the right owner", async function () {
  //     expect(await slotMachine.owner()).to.equal(owner.address);
  //   });
  // });

  describe("Spin", function () {
    it("Should spin and store request IDs", async function () {
      await slotMachine.connect(addr1).spin(1, { value: ethers.utils.parseEther("0.01") });

      const currentRequestId = Number(await nativeVRF.currentRequestId());
      expect(currentRequestId).to.be.gt(0);
      expect(await slotMachine.spinRequests(currentRequestId - 1)).to.equal(addr1.address);
    });

    it("Should fail if insufficient fee is sent", async function () {
      await expect(
        slotMachine.connect(addr1).spin(1, { value: ethers.utils.parseEther("0.005") })
      ).to.be.revertedWith("Insufficient spin fee");
    });
  });

  describe("Fulfill Spin", function () {
    it("Should fulfill spin and distribute rewards correctly", async function () {
      // Spin and store request IDs
      const tx = await slotMachine.connect(addr1).spin(1, { value: ethers.utils.parseEther("0.01") });
      // filter event SpinRequested
      const eventArgs = (await tx.wait()).events?.filter((e) => e.event === "SpinRequested")[0].args
      const requestId = eventArgs?.requestId

      // Mock the fulfillment
      await fullfillRandomness(requestId, owner, nativeVRF);


      // Check if the spin was processed correctly
      const randomResult = await nativeVRF.randomResults(requestId);
      //console.log("randomResult", randomResult.toString())
      const player = await slotMachine.spinRequests(requestId);
      expect(player).to.equal(addr1.address);


      const fullfillSpinTx = await slotMachine.fulfillSpins([requestId]);
      const receipt = await fullfillSpinTx.wait();
      const result = receipt.events?.filter((e) => e.event === "SpinResult")[0].args?.won;

      // prevoius balance of the player
      const previousBalance = await ethers.provider.getBalance(addr1.address);
      
      if (result) {
        console.log("won")
        // expected balance > previous balance
        const reward = await slotMachine.pendingRewards(addr1.address);
        console.log("reward", reward.toString())
        await slotMachine.connect(addr1).claimReward();
        const currentBalance = await ethers.provider.getBalance(addr1.address);
        expect(currentBalance).to.be.gt(previousBalance);
      } else {
        console.log("loser")
        // expected balance to be the same
        const currentBalance = await ethers.provider.getBalance(addr1.address);
        expect(currentBalance).to.equal(previousBalance);
      }
    });
  });
});
