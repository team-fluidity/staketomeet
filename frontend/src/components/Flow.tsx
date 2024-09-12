import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import INTRO from './Intro';
import SCHEDULE from './Schedule';
import LoadingScreen from './Loading';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './ContractConstants';

const UserFlow: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [hasScheduledMeeting, setHasScheduledMeeting] = useState(false);
  const { address } = useAccount();

  const { data: registrationStatus } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'registeredUsers',
    args: [address],
  }) as { data: boolean | undefined };

  // You'll need to implement a function to check for scheduled meetings
  // This is a placeholder and should be replaced with actual logic
  const checkScheduledMeetings = async () => {
    // Implement logic to check if user has scheduled meetings
    // setHasScheduledMeeting(true/false) based on the result
    setHasScheduledMeeting(false); // Placeholder
  };

  useEffect(() => {
    if (registrationStatus !== undefined) {
      setIsRegistered(registrationStatus);
      if (registrationStatus) {
        checkScheduledMeetings();
      }
      setIsLoading(false);
    }
  }, [registrationStatus]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isRegistered) {
    return <INTRO />;
  }

  if (hasScheduledMeeting) {
    // Replace this with your MeetingCheckin component when it's created
    return <div>Meeting Checkin Page (To be implemented)</div>;
  }

  return <SCHEDULE />;
};

export default UserFlow;