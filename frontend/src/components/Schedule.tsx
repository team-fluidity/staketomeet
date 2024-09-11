import React, { useState, ChangeEvent } from 'react';
import {
  useWriteContract,
  useReadContract,
  useAccount,
  useWaitForTransactionReceipt,
  usePublicClient,
  useWalletClient,
} from "wagmi";
import { parseEther } from "viem";
import { waitForTransactionReceipt } from "viem/actions";
import { type PublicClient, type WalletClient } from "viem";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import LoadingScreen from "../components/Loading";
import MeetingContract from "../../contract/contract.json";

// Replace with your actual contract address and ABI
const CONTRACT_ADDRESS = "0x7aad729622232F36117B369466F0f51e3ce951d6";
const CONTRACT_ABI = MeetingContract.abi;

const Schedule = () => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [bookedAddress, setBookedAddress] = useState('');
    const [stakeAmount, setStakeAmount] = useState('');
    const { address } = useAccount();
  
    const { data: isRegistered } = useReadContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'registeredUsers',
      args: [address],
    }) as { data: boolean | undefined };
  
    const { writeContract: registerUser, data: registerData } = useWriteContract();
  
    const { writeContract: bookMeeting, data: bookData } = useWriteContract();
  
    const { isLoading: isRegistering, isSuccess: isRegistrationComplete } = useWaitForTransactionReceipt({
      hash: registerData,
    });
  
    const { isLoading: isBooking, isSuccess: isBooked } = useWaitForTransactionReceipt({
      hash: bookData,
    });
  
    const handleRegister = () => {
      if (!address) return;
      registerUser({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'registerUser',
      });
    };
  
    const handleBook = () => {
      if (!bookedAddress || !selectedDate || !stakeAmount || !address) return;
  
      const startTime = Math.floor(selectedDate.getTime() / 1000);
      bookMeeting({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'bookMeeting',
        args: [bookedAddress, BigInt(startTime)],
        value: parseEther(stakeAmount),
      });
    };
  
    const handleBookedAddressChange = (e: ChangeEvent<HTMLInputElement>) => {
      setBookedAddress(e.target.value);
    };
  
    const handleStakeAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
      setStakeAmount(e.target.value);
    };
  
    return (
        <div className="p-4 max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-4">Meeting Booking</h1>
          
          {isRegistered === false && (
            <div className="mb-4">
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <p>You are not registered. Please register first.</p>
              </div>
              <button 
                onClick={handleRegister} 
                disabled={isRegistering}
                className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ${isRegistering ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isRegistering ? 'Registering...' : 'Register'}
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
                disabled={isBooking}
                className={`w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ${isBooking ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isBooking ? 'Booking...' : 'Book Meeting'}
              </button>
            </form>
          )}
    
          {isBooked && (
            <div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
              <p>Meeting booked successfully!</p>
            </div>
          )}
        </div>
      );
    };
export default Schedule;
