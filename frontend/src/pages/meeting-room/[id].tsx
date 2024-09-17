import { useRouter } from 'next/router';
import MeetingRoom from '../../components/MeetingRoom';

const MeetingRoomPage = () => {
  const router = useRouter();
  const { id } = router.query;

  if (router.isReady && id) {
    return <MeetingRoom meetingId={id} />;
  }

};

export default MeetingRoomPage;