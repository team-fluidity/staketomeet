// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MeetingBooking {
    struct Meeting {
        address booker;
        address booked;
        uint256 startTime;
        uint256 stakedAmount;
        bool bookerCheckedIn;
        bool bookedCheckedIn;
        bool completed;
        bool deleted;
    }

    mapping(address => bool) public registeredUsers;
    mapping(uint256 => Meeting) public meetings;
    mapping(address => uint256[]) public userMeetings;
    uint256 public nextMeetingId;

    event UserRegistered(address user);
    event MeetingBooked(uint256 meetingId, address booker, address booked, uint256 startTime);
    event UserCheckedIn(uint256 meetingId, address user);
    event MeetingCompleted(uint256 meetingId);
    event StakeReturned(uint256 meetingId, address recipient, uint256 amount);
    event MeetingDeleted(uint256 meetingId);

    function registerUser() external {
        require(!registeredUsers[msg.sender], "User already registered");
        registeredUsers[msg.sender] = true;
        emit UserRegistered(msg.sender);
    }

    function bookMeeting(address _booked, uint256 _startTime) external payable {
        require(registeredUsers[msg.sender], "Booker not registered");
        require(registeredUsers[_booked], "Booked person not registered");
        require(_startTime > block.timestamp, "Start time must be in the future");
        require(msg.value > 0, "Must stake some ETH");

        uint256 meetingId = nextMeetingId++;
        meetings[meetingId] = Meeting({
            booker: msg.sender,
            booked: _booked,
            startTime: _startTime,
            stakedAmount: msg.value,
            bookerCheckedIn: false,
            bookedCheckedIn: false,
            completed: false,
            deleted: false
        });

        userMeetings[msg.sender].push(meetingId);
        userMeetings[_booked].push(meetingId);

        emit MeetingBooked(meetingId, msg.sender, _booked, _startTime);
    }

    function checkIn(uint256 _meetingId) external {
        Meeting storage meeting = meetings[_meetingId];
        require(!meeting.deleted, "Meeting has been deleted");
        require(msg.sender == meeting.booker || msg.sender == meeting.booked, "Not part of this meeting");
        require(!meeting.completed, "Meeting already completed");
        require(block.timestamp >= meeting.startTime, "Meeting hasn't started yet");

        if (msg.sender == meeting.booker) {
            meeting.bookerCheckedIn = true;
        } else if (msg.sender == meeting.booked) {
            meeting.bookedCheckedIn = true;
        }

        emit UserCheckedIn(_meetingId, msg.sender);

        if (meeting.bookerCheckedIn && meeting.bookedCheckedIn) {
            completeMeeting(_meetingId);
        }
    }

    function completeMeeting(uint256 _meetingId) internal {
        Meeting storage meeting = meetings[_meetingId];
        meeting.completed = true;

        if (meeting.bookerCheckedIn && meeting.bookedCheckedIn) {
            payable(meeting.booker).transfer(meeting.stakedAmount);
            emit StakeReturned(_meetingId, meeting.booker, meeting.stakedAmount);
        } else if (meeting.bookerCheckedIn && !meeting.bookedCheckedIn) {
            payable(meeting.booker).transfer(meeting.stakedAmount);
            emit StakeReturned(_meetingId, meeting.booker, meeting.stakedAmount);
        } else {
            payable(meeting.booked).transfer(meeting.stakedAmount);
            emit StakeReturned(_meetingId, meeting.booked, meeting.stakedAmount);
        }

        emit MeetingCompleted(_meetingId);

        // Automatically delete the meeting and clean up user meetings
        deleteMeeting(_meetingId);
        cleanUpUserMeetings(meeting.booker);
        cleanUpUserMeetings(meeting.booked);
    }

    function handleEndedMeeting(uint256 _meetingId) external {
        Meeting storage meeting = meetings[_meetingId];
        require(!meeting.deleted, "Meeting has been deleted");
        require(!meeting.completed, "Meeting already completed");
        require(block.timestamp > meeting.startTime, "Meeting hasn't started yet");

        completeMeeting(_meetingId);
    }

    function getUserMeetings(address _user) external view returns (uint256[] memory) {
        return userMeetings[_user];
    }

    function getUserMeetingCount(address _user) external view returns (uint256) {
        return userMeetings[_user].length;
    }

    function getPastMeetings(address _user) external view returns (uint256[] memory) {
        uint256[] memory allMeetings = userMeetings[_user];
        uint256[] memory pastMeetings = new uint256[](allMeetings.length);
        uint256 count = 0;

        for (uint256 i = 0; i < allMeetings.length; i++) {
            if (!meetings[allMeetings[i]].deleted && meetings[allMeetings[i]].startTime < block.timestamp) {
                pastMeetings[count] = allMeetings[i];
                count++;
            }
        }

        assembly {
            mstore(pastMeetings, count)
        }

        return pastMeetings;
    }

    // Modified to be internal and called automatically
    function deleteMeeting(uint256 _meetingId) internal {
        Meeting storage meeting = meetings[_meetingId];
        require(!meeting.deleted, "Meeting already deleted");

        meeting.deleted = true;
        emit MeetingDeleted(_meetingId);
    }

    // Modified to be internal and called automatically
    function cleanUpUserMeetings(address user) internal {
        uint256[] storage userMeetingList = userMeetings[user];
        uint256 writeIndex = 0;

        for (uint256 readIndex = 0; readIndex < userMeetingList.length; readIndex++) {
            if (!meetings[userMeetingList[readIndex]].deleted) {
                userMeetingList[writeIndex] = userMeetingList[readIndex];
                writeIndex++;
            }
        }

        while (userMeetingList.length > writeIndex) {
            userMeetingList.pop();
        }
    }
}