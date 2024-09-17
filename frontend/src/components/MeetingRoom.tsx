import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAccount, usePublicClient, useWalletClient, useReadContract } from "wagmi";
import { waitForTransactionReceipt } from "viem/actions";
import { formatEther } from "viem";
import Link from 'next/link';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './ContractConstants';
import LoadingScreen from './Loading';

interface MeetingDetails {
  booker: string;
  booked: string;
  startTime: bigint;
  stakedAmount: bigint;
  bookerCheckedIn: boolean;
  bookedCheckedIn: boolean;
  completed: boolean;
  deleted: boolean;
}

interface MeetingRoomProps {
  meetingId: string | string[] | number | undefined;
}

const MeetingRoom: React.FC<MeetingRoomProps> = ({ meetingId }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [processedMeetingDetails, setProcessedMeetingDetails] = useState<MeetingDetails | null>(null);

  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  console.log("Contract Address:", CONTRACT_ADDRESS);
  console.log("Contract ABI:", CONTRACT_ABI);

  // Safely convert meetingId to BigInt
  const safeMeetingId = React.useMemo(() => {
    console.log("Raw meetingId:", meetingId);
    if (meetingId === undefined || meetingId === '') {
      console.log("MeetingId is undefined or empty");
      return null;
    }
    if (typeof meetingId === 'number') {
      return BigInt(meetingId);
    }
    if (typeof meetingId === 'string') {
      try {
        const bigIntId = BigInt(meetingId);
        console.log("Converted meetingId to BigInt:", bigIntId.toString());
        return bigIntId;
      } catch (e) {
        console.error('Invalid meetingId:', e);
        return null;
      }
    }
    return null;
  }, [meetingId]);

  const { 
    data: rawMeetingDetails, 
    isLoading: isMeetingLoading, 
    isError: isMeetingError,
    error: meetingError
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'meetings',
    args: safeMeetingId !== null ? [safeMeetingId] : undefined,
  }) as { 
    data: any[] | undefined; 
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
  };

  useEffect(() => {
    console.log("Safe Meeting ID:", safeMeetingId);
    console.log("Raw meeting details:", rawMeetingDetails);
    console.log("Is meeting loading:", isMeetingLoading);
    console.log("Is meeting error:", isMeetingError);
    console.log("Meeting error:", meetingError);

    if (safeMeetingId === null) {
      console.log("Meeting ID is null");
      setError("Invalid meeting ID");
      setLoading(false);
    } else if (!isMeetingLoading) {
      if (isMeetingError) {
        console.log("Error fetching meeting details:", meetingError);
        setError(meetingError?.message || "Failed to fetch meeting details");
      } else if (rawMeetingDetails && Array.isArray(rawMeetingDetails) && rawMeetingDetails.length === 8) {
        const [booker, booked, startTime, stakedAmount, bookerCheckedIn, bookedCheckedIn, completed, deleted] = rawMeetingDetails;
        const processedDetails: MeetingDetails = {
          booker: booker as string,
          booked: booked as string,
          startTime: BigInt(startTime.toString()),
          stakedAmount: BigInt(stakedAmount.toString()),
          bookerCheckedIn: bookerCheckedIn as boolean,
          bookedCheckedIn: bookedCheckedIn as boolean,
          completed: completed as boolean,
          deleted: deleted as boolean
        };
        console.log("Processed meeting details:", processedDetails);
        setProcessedMeetingDetails(processedDetails);
        setIsCheckedIn(
          (address === processedDetails.booker && processedDetails.bookerCheckedIn) ||
          (address === processedDetails.booked && processedDetails.bookedCheckedIn)
        );
      } else {
        console.log("Invalid meeting details:", rawMeetingDetails);
        setError("No meeting found with this ID or invalid data format");
      }
      setLoading(false);
    }
  }, [safeMeetingId, rawMeetingDetails, isMeetingLoading, isMeetingError, meetingError, address]);

  useEffect(() => {
    console.log("Wallet connected:", isConnected);
    console.log("Current address:", address);
  }, [isConnected, address]);

  const handleCheckIn = async () => {
    console.log("Checking in...");
    console.log("Public Client:", !!publicClient);
    console.log("Wallet Client:", !!walletClient);
    console.log("Address:", address);
    console.log("Safe Meeting ID:", safeMeetingId);
  
    if (!publicClient || !walletClient || !address || safeMeetingId === null) {
      console.log("Check-in failed. Missing:", {
        publicClient: !publicClient,
        walletClient: !walletClient,
        address: !address,
        safeMeetingId: safeMeetingId === null
      });
      setError("Wallet not connected or invalid meeting ID");
      return;
    }
    setLoading(true);
    setError(null);
  
    try {
      const { request } = await publicClient.simulateContract({
        account: walletClient.account,
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "checkIn",
        args: [safeMeetingId],
      });
  
      const hash = await walletClient.writeContract(request);
      console.log("Transaction sent:", hash);
  
      const receipt = await waitForTransactionReceipt(publicClient, {
        hash,
      });
  
      console.log("Transaction confirmed:", receipt.transactionHash);
      setIsCheckedIn(true);
    } catch (err) {
      console.error("Error during check-in:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleEndMeeting = async () => {
    console.log("Ending meeting...");
    console.log("Public Client:", !!publicClient);
    console.log("Wallet Client:", !!walletClient);
    console.log("Address:", address);
    console.log("Safe Meeting ID:", safeMeetingId);
  
    if (!publicClient || !walletClient || !address || safeMeetingId === null) {
      console.log("End meeting failed. Missing:", {
        publicClient: !publicClient,
        walletClient: !walletClient,
        address: !address,
        safeMeetingId: safeMeetingId === null
      });
      setError("Wallet not connected or invalid meeting ID");
      return;
    }
    setLoading(true);
    setError(null);
  
    try {
      const { request } = await publicClient.simulateContract({
        account: walletClient.account,
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "handleEndedMeeting",
        args: [safeMeetingId],
      });
  
      const hash = await walletClient.writeContract(request);
      console.log("Transaction sent:", hash);
  
      const receipt = await waitForTransactionReceipt(publicClient, {
        hash,
      });
  
      console.log("Transaction confirmed:", receipt.transactionHash);
      router.push('/');
    } catch (err) {
      console.error("Error ending meeting:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen pt-20">
      <div className="bg-[#8697c4]/80 backdrop-blur-lg shadow-lg rounded-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6">Meeting Room</h1>
        {processedMeetingDetails && (
          <div className="space-y-4">
            <p><strong>Meeting ID:</strong> {meetingId}</p>
            <p><strong>Start Time:</strong> {new Date(Number(processedMeetingDetails.startTime) * 1000).toLocaleString()}</p>
            <p><strong>Booker:</strong> {processedMeetingDetails.booker}</p>
            <p><strong>Booked:</strong> {processedMeetingDetails.booked}</p>
            <p><strong>Status:</strong> {processedMeetingDetails.completed ? 'Completed' : 'In Progress'}</p>
            <p><strong>Staked Amount:</strong> {formatEther(processedMeetingDetails.stakedAmount)} ETH</p>
            <p><strong>Booker Checked In:</strong> {processedMeetingDetails.bookerCheckedIn ? 'Yes' : 'No'}</p>
            <p><strong>Booked Checked In:</strong> {processedMeetingDetails.bookedCheckedIn ? 'Yes' : 'No'}</p>
            
            {!isCheckedIn && !processedMeetingDetails.completed && (
              <button
                onClick={handleCheckIn}
                className="w-full bg-[#3d52a0] hover:bg-[#7091e6] text-white font-bold py-3 px-6 rounded-lg transition duration-300"
              >
                Check In
              </button>
            )}
            
            {isCheckedIn && !processedMeetingDetails.completed && (
              <button
                onClick={handleEndMeeting}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
              >
                End Meeting
              </button>
            )}
          </div>
        )}
        {error && (
          <p className="mt-4 text-red-500 text-center">{error}</p>
        )}
        <Link href="/" className="mt-6 inline-block bg-[#adbbda] hover:bg-[#8697c4] text-[#3d52a0] font-bold py-2 px-4 rounded-lg transition duration-300">
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default MeetingRoom;