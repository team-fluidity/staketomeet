const hre = require("hardhat");
require("dotenv").config();

async function main() {
  // Check if the private key is set
  if (!process.env.PRIVATE_KEY) {
    throw new Error("Please set your PRIVATE_KEY in a .env file");
  }

  console.log("Deploying MeetingBooking contract...");

  // Create a wallet instance from the private key
  const wallet = new hre.ethers.Wallet(process.env.PRIVATE_KEY, hre.ethers.provider);

  console.log("Deploying contract with the account:", wallet.address);

  // Get the ContractFactory
  const MeetingBooking = await hre.ethers.getContractFactory("MeetingBooking", wallet);

  // Deploy the contract
  const meetingBooking = await MeetingBooking.deploy();

  // Wait for the contract to be deployed
  await meetingBooking.waitForDeployment();

  // Get the address of the deployed contract
  const meetingBookingAddress = await meetingBooking.getAddress();

  console.log("MeetingBooking contract deployed to:", meetingBookingAddress);

  // Optionally, verify the contract on Etherscan
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    
    // Wait for 6 block confirmations
    await meetingBooking.deploymentTransaction().wait(6);
    
    console.log("Verifying contract on Etherscan...");
    await hre.run("verify:verify", {
      address: meetingBookingAddress,
      constructorArguments: [],
    });
  }
}

// Execute the deployment function
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });