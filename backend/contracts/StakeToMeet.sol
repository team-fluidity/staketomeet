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
    }

    mapping(address => bool) public registeredUsers;
    mapping(uint256 => Meeting) public meetings;
    uint256 public nextMeetingId;

    event UserRegistered(address user);
    event MeetingBooked(uint256 meetingId, address booker, address booked, uint256 startTime);
    event UserCheckedIn(uint256 meetingId, address user);
    event MeetingCompleted(uint256 meetingId);
    event StakeReturned(uint256 meetingId, address recipient, uint256 amount);

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
            completed: false
        });

        emit MeetingBooked(meetingId, msg.sender, _booked, _startTime);
    }

    function checkIn(uint256 _meetingId) external {
        Meeting storage meeting = meetings[_meetingId];
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

        // Return stake to booker if both checked in
        if (meeting.bookerCheckedIn && meeting.bookedCheckedIn) {
            payable(meeting.booker).transfer(meeting.stakedAmount);
            emit StakeReturned(_meetingId, meeting.booker, meeting.stakedAmount);
        } else if (meeting.bookerCheckedIn  && !meeting.bookedCheckedIn) {
           // return stake to the booker if the booked person didn't check in
            payable(meeting.booker).transfer(meeting.stakedAmount);
            emit StakeReturned(_meetingId, meeting.booker, meeting.stakedAmount);
        } else {
            // Transfer stake to booked person if booker didn't check in
            payable(meeting.booked).transfer(meeting.stakedAmount);
            emit StakeReturned(_meetingId, meeting.booked, meeting.stakedAmount);
        }

        emit MeetingCompleted(_meetingId);
    }

    // Function to handle meetings that have ended without both parties checking in
    function handleEndedMeeting(uint256 _meetingId) external {
        Meeting storage meeting = meetings[_meetingId];
        require(!meeting.completed, "Meeting already completed");
        require(block.timestamp > meeting.startTime, "Meeting hasn't started yet"); // can add additional time to allow for check-in

        completeMeeting(_meetingId);
    }
}