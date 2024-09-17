import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAccount, useReadContract } from 'wagmi';
import INTRO from './Intro';
import SCHEDULE from './Schedule';
import MeetingRoom from './MeetingRoom';
import LoadingScreen from './Loading';
import WalletConnect from './WalletConnect';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './ContractConstants';

const UserFlow: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [hasScheduledMeeting, setHasScheduledMeeting] = useState(false);
  const [meetingId, setMeetingId] = useState<number | null>(null);
  const { address, isConnected } = useAccount();

  const { data: registrationStatus, isLoading: isRegistrationLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'registeredUsers',
    args: [address],
    // enabled: !!address,
  }) as { data: boolean | undefined; isLoading: boolean };

  const { data: userMeetings, isLoading: isMeetingsLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getUserMeetings',
    args: [address],
    // enabled: !!address && isRegistered,
  }) as { data: number[] | undefined; isLoading: boolean };

  useEffect(() => {
    if (!isConnected) {
      setIsLoading(false);
      return;
    }

    if (!isRegistrationLoading && registrationStatus !== undefined) {
      setIsRegistered(registrationStatus);
      setIsLoading(isMeetingsLoading);
    }
  }, [isConnected, registrationStatus, isRegistrationLoading, isMeetingsLoading]);

  useEffect(() => {
    if (!isMeetingsLoading && userMeetings && userMeetings.length > 0) {
      const latestMeeting = userMeetings[userMeetings.length - 1];
      setHasScheduledMeeting(true);
      setMeetingId(Number(latestMeeting));
      router.push(`/meeting-room/${latestMeeting}`);
    } else {
      setHasScheduledMeeting(false);
      setMeetingId(null);
    }
    setIsLoading(false);
  }, [userMeetings, isMeetingsLoading, router]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isConnected) {
    return <WalletConnect />;
  }

  if (!isRegistered) {
    return <INTRO />;
  }

  if (hasScheduledMeeting && meetingId !== null) {
    return <MeetingRoom meetingId={meetingId} />;
  }

  return <SCHEDULE />;
};

export default UserFlow;