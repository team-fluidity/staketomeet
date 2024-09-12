import React, { useState, ChangeEvent } from 'react';
import {
  useWriteContract,
  useReadContract,
  useAccount,
  usePublicClient,
  useWalletClient,
} from "wagmi";
import { parseEther } from "viem";
import { waitForTransactionReceipt } from "viem/actions";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import LoadingScreen from "../components/Loading";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './ContractConstants';

const Schedule = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [bookedAddress, setBookedAddress] = useState('');
  const [stakeAmount, setStakeAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { writeContract } = useWriteContract();

  const { data: isRegistered } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'registeredUsers',
    args: [address],
  }) as { data: boolean | undefined };

  const handleRegister = async () => {
    if (!publicClient || !walletClient || !address) {
      setError("Wallet not connected");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const { request } = await publicClient.simulateContract({
        account: walletClient.account,
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "registerUser",
        args: [],
      });

      const hash = await walletClient.writeContract(request);
      console.log("Transaction sent:", hash);

      const receipt = await waitForTransactionReceipt(publicClient, {
        hash,
      });

      console.log("Transaction confirmed:", receipt.transactionHash);
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!publicClient || !walletClient || !address || !bookedAddress || !selectedDate || !stakeAmount) {
      setError("Invalid input or wallet not connected");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const startTime = BigInt(Math.floor(selectedDate.getTime() / 1000));
      const { request } = await publicClient.simulateContract({
        account: walletClient.account,
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "bookMeeting",
        args: [bookedAddress, startTime],
        value: parseEther(stakeAmount),
      });

      const hash = await walletClient.writeContract(request);
      console.log("Transaction sent:", hash);

      const receipt = await waitForTransactionReceipt(publicClient, {
        hash,
      });

      console.log("Transaction confirmed:", receipt.transactionHash);
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleBookedAddressChange = (e: ChangeEvent<HTMLInputElement>) => {
    setBookedAddress(e.target.value);
  };

  const handleStakeAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    setStakeAmount(e.target.value);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="p-4 max-w-md mx-auto mt-28">
      <h1 className="text-2xl font-bold mb-4">Book a Meeting</h1>
      
      {isRegistered === false && (
        <div className="mb-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <p>You are not registered. Please register first.</p>
          </div>
          <button 
            onClick={handleRegister}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Register
          </button>
        </div>
      )}

      {isRegistered === true && (
        <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); handleBook(); }} className="space-y-4">
          <div>
            <label htmlFor="bookedAddress" className="block text-sm font-medium text-gray-700 mb-2">Booked Address</label>
            <input
              id="bookedAddress"
              type="text"
              value={bookedAddress}
              onChange={handleBookedAddressChange}
              placeholder="0x..."
              required
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="datePicker" className="block text-sm font-medium text-gray-700 mb-2">Select Date and Time</label>
            <DatePicker
              id="datePicker"
              selected={selectedDate}
              onChange={(date: Date | null) => setSelectedDate(date)}
              showTimeSelect
              dateFormat="Pp"
              minDate={new Date()}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="stakeAmount" className="block text-sm font-medium text-gray-700 mb-2">Stake Amount (ETH)</label>
            <input
              id="stakeAmount"
              type="number"
              value={stakeAmount}
              onChange={handleStakeAmountChange}
              placeholder="0.1"
              step="0.01"
              min="0"
              required
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Book Meeting
          </button>
        </form>
      )}

      {error && (
        <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default Schedule;