import dynamic from "next/dynamic";
import Image from "next/image";
import {
  useWriteContract,
  useReadContract,
  useAccount,
  useWaitForTransactionReceipt,
  usePublicClient,
  useWalletClient,
} from "wagmi";
import { waitForTransactionReceipt } from "viem/actions";
import { type PublicClient, type WalletClient } from "viem";
import React, { useState, useEffect } from "react";
import LoadingScreen from "../components/Loading";
import { parseEther } from "viem";
import MeetingContract from "../../contract/contract.json";
import BUTTON from "../components/Button";

const Intro = () => {
  const { writeContract } = useWriteContract();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const { address, isConnected } = useAccount();
  const [loading, setLoading] = useState<boolean>(false);
  const [minted, setMinted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const contractAddress = "0x7aad729622232F36117B369466F0f51e3ce951d6";

  const contractConfig = {
    address: contractAddress,
    abi: MeetingContract.abi,
  };

  // //Choose amount of Ape Insurance
  // const handleApeInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   setApeAmount(Number(event.target.value));
  //   //setYoutubeId(event.target.value);
  // };

  // const handleSubmit = () => {
  //   // Handle the submission of the YouTube ID here
  //   sendRequest();
  //   // console.log("Value:", inputValue);
  // };

  const registerAddress = async () => {
    if (!publicClient || !walletClient) {
      setError("Wallet not connected");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const { request } = await publicClient.simulateContract({
        account: walletClient.account,
        address: contractAddress,
        abi: MeetingContract.abi,
        functionName: "registerUser",
        args: [], // set positions if needed
      });

      const hash = await walletClient.writeContract(request);

      console.log("Transaction sent:", hash);

      const receipt = await waitForTransactionReceipt(publicClient, {
        hash,
      });

      console.log("Transaction confirmed:", receipt.transactionHash);
      setMinted(true);
    } catch (err) {
      console.error("Error:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black h-screen w-full">
      {!loading && (
        <div className="flex flex-col md:flex-row px-5 justify-center lg:mr-16 h-screen w-full">
          <div className="relative flex w-full h-screen content-center items-center justify-center md:h-screen z-10 bg-gradient-to-b from-black to-slate-300">
            <div className="container relative mx-auto p-16 md:p-0">
              <div className="flex flex-col items-center justify-center -mt-6 md:mt-0 sm:-ml-0 md:-ml-12">
                <div className="text-center md:text-left md:ml-16 space-y-4">
                  <h1 className="text-4xl md:text-6xl font-bold text-center text-white mb-8">
                    Get Paid for Your Time
                  </h1>
                  {!loading && !minted && (
                    <>
                      <h2 className="text-3xl md:text-5xl font-bold text-center text-white">
                        Register Your Address
                      </h2>
                      <p className="text-white text-center text-xl">
                        So users can setup meetings with you
                      </p>
                      <div className="flex flex-col justify-center items-center mt-4">
                        <button
                          onClick={registerAddress}
                          className="bg-blue-500 px-6 py-3 text-white text-lg rounded-lg hover:bg-blue-600 transition duration-300"
                        >
                          Submit
                        </button>
                      </div>
                    </>
                  )}
                  {!loading && minted && (
                    <>
                      <h2 className="text-3xl md:text-5xl font-bold text-center text-white">
                        Address Registered
                      </h2>
                      <p className="text-white text-center text-xl">
                        You can now setup meetings
                      </p>
                      <div className="flex flex-col justify-center items-center mt-4">
                        <button
                          onClick={() => setMinted(false)}
                          className="bg-blue-500 px-6 py-3 text-white text-lg rounded-lg hover:bg-blue-600 transition duration-300"
                        >
                          Register Another Address
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {loading && isConnected && <LoadingScreen />}
    </div>
  );
};

// export default Intro;
export default dynamic(() => Promise.resolve(Intro), { ssr: false });
