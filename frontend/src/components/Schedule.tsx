import React, { useState, ChangeEvent, useEffect } from "react";
import {
  useWriteContract,
  useReadContract,
  useAccount,
  usePublicClient,
  useWalletClient,
} from "wagmi";
import { parseEther, type Hash } from "viem";
import { waitForTransactionReceipt} from "viem/actions";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Link from "next/link";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./ContractConstants";
import LoadingScreen from "./Loading";

interface MeetingDetails {
  id: number;
  booker: string;
  booked: string;
  startTime: bigint;
  stakedAmount: bigint;
  bookerCheckedIn: boolean;
  bookedCheckedIn: boolean;
  completed: boolean;
  deleted: boolean;
}

const Schedule: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [bookedAddress, setBookedAddress] = useState("");
  const [stakeAmount, setStakeAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [existingMeeting, setExistingMeeting] = useState<MeetingDetails | null>(
    null
  );

  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { writeContract } = useWriteContract();

  const {
    data: isRegistered,
    isLoading: isRegisteredLoading,
    isError: isRegisteredError,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "registeredUsers",
    args: address ? [address] : undefined,
  }) as { data: boolean | undefined; isLoading: boolean; isError: boolean };

  const {
    data: userMeetings,
    isLoading: userMeetingsLoading,
    isError: userMeetingsError,
    refetch: refetchUserMeetings,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getUserMeetings",
    args: address && isRegistered ? [address] : undefined,
  }) as {
    data: number[] | undefined;
    isLoading: boolean;
    isError: boolean;
    refetch: () => void;
  };

  useEffect(() => {
    const loadData = async () => {
      if (isRegisteredError || userMeetingsError) {
        setError("Error fetching user data");
        setLoading(false);
        return;
      }

      if (!isRegisteredLoading && isRegistered !== undefined) {
        if (isRegistered === false) {
          setLoading(false);
        } else if (
          !userMeetingsLoading &&
          userMeetings &&
          userMeetings.length > 0
        ) {
          const latestMeetingId = userMeetings[userMeetings.length - 1];
          console.log("Latest meeting ID (before fetch):", latestMeetingId); // Debug log
          await fetchMeetingDetails(latestMeetingId);
        } else {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [
    isRegistered,
    userMeetings,
    isRegisteredLoading,
    userMeetingsLoading,
    isRegisteredError,
    userMeetingsError,
  ]);

  const fetchMeetingDetails = async (meetingId: number) => {
    if (!publicClient) {
      setError("Public client not available");
      setLoading(false);
      return;
    }

    try {
      console.log("Fetching details for meeting ID:", meetingId); // Debug log
      const result = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "meetings",
        args: [BigInt(meetingId)],
      });

      console.log("Raw result from contract:", result); // Debug log

      // Ensure result is an array
      if (!Array.isArray(result)) {
        throw new Error("Unexpected result format");
      }

      const [
        booker,
        booked,
        startTime,
        stakedAmount,
        bookerCheckedIn,
        bookedCheckedIn,
        completed,
        deleted,
      ] = result;

      const details: MeetingDetails = {
        id: Number(meetingId), // Convert BigInt to number
        booker: booker as string,
        booked: booked as string,
        startTime: startTime as bigint,
        stakedAmount: stakedAmount as bigint,
        bookerCheckedIn: bookerCheckedIn as boolean,
        bookedCheckedIn: bookedCheckedIn as boolean,
        completed: completed as boolean,
        deleted: deleted as boolean,
      };

      console.log("Processed meeting details:", details); // Debug log
      setExistingMeeting(details);
    } catch (err) {
      console.error("Error fetching meeting details:", err);
      setError("Failed to fetch meeting details");
    } finally {
      setLoading(false);
    }
  };

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
        hash: hash as Hash,
      });

      console.log("Transaction confirmed:", receipt.transactionHash);
      refetchUserMeetings();
    } catch (err) {
      console.error("Error:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (
      !publicClient ||
      !walletClient ||
      !address ||
      !bookedAddress ||
      !selectedDate ||
      !stakeAmount
    ) {
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
        hash: hash as Hash,
      });

      console.log("Transaction confirmed:", receipt.transactionHash);
      refetchUserMeetings();
    } catch (err) {
      console.error("Error:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
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

  if (error) {
    return (
      <div className="p-4 max-w-md mx-auto mt-28">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (existingMeeting) {
    console.log("Rendering meeting details:", existingMeeting); // Debug log
    return (
      <div className="p-4 max-w-md mx-auto mt-28">
        <h1 className="text-2xl font-bold mb-4">Your Scheduled Meeting</h1>
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <p className="mb-2">
            <strong>Meeting ID:</strong> {existingMeeting.id}
          </p>
          <p className="mb-2">
            <strong>Start Time:</strong>{" "}
            {new Date(
              Number(existingMeeting.startTime) * 1000
            ).toLocaleString()}
          </p>
          <p className="mb-2">
            <strong>Booker:</strong> {existingMeeting.booker}
          </p>
          <p className="mb-2">
            <strong>Booked:</strong> {existingMeeting.booked}
          </p>
          <p className="mb-2">
            <strong>Status:</strong>{" "}
            {existingMeeting.completed ? "Completed" : "Scheduled"}
          </p>
          <p className="mb-2">
            <strong>Staked Amount:</strong>{" "}
            {parseFloat(existingMeeting.stakedAmount.toString()) / 1e18} ETH
          </p>
          <p className="mb-2">
            <strong>Booker Checked In:</strong>{" "}
            {existingMeeting.bookerCheckedIn ? "Yes" : "No"}
          </p>
          <p className="mb-2">
            <strong>Booked Checked In:</strong>{" "}
            {existingMeeting.bookedCheckedIn ? "Yes" : "No"}
          </p>
          <Link
            href={`/meeting-room/${existingMeeting.id}`}
            className="mt-4 inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Go to Meeting Room
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto mt-28">
      <h1 className="text-2xl font-bold mb-4">Book a Meeting</h1>

      {isRegistered === false && (
        <div className="mb-4">
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
            role="alert"
          >
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
        <form
          onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            handleBook();
          }}
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="bookedAddress"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Booked Address
            </label>
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
            <label
              htmlFor="datePicker"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Select Date and Time
            </label>
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
            <label
              htmlFor="stakeAmount"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Stake Amount (ETH)
            </label>
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
    </div>
  );
};

export default Schedule;
