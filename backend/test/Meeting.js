const {
    time,
    loadFixture,
  } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
  const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
  const { expect } = require("chai");
  const { ethers } = require("hardhat");
  
  describe("MeetingBooking", function () {
    async function deployMeetingBookingFixture() {
      const [owner, booker, booked] = await ethers.getSigners();
  
      const MeetingBooking = await ethers.getContractFactory("MeetingBooking");
      const meetingBooking = await MeetingBooking.deploy();
  
      return { meetingBooking, owner, booker, booked };
    }
  
    describe("User Registration", function () {
      it("Should allow a user to register", async function () {
        const { meetingBooking, booker } = await loadFixture(deployMeetingBookingFixture);
  
        await expect(meetingBooking.connect(booker).registerUser())
          .to.emit(meetingBooking, "UserRegistered")
          .withArgs(booker.address);
  
        expect(await meetingBooking.registeredUsers(booker.address)).to.be.true;
      });
  
      it("Should not allow a user to register twice", async function () {
        const { meetingBooking, booker } = await loadFixture(deployMeetingBookingFixture);
  
        await meetingBooking.connect(booker).registerUser();
  
        await expect(meetingBooking.connect(booker).registerUser())
          .to.be.revertedWith("User already registered");
      });
    });
  
    describe("Meeting Booking", function () {
      it("Should allow a registered user to book a meeting", async function () {
        const { meetingBooking, booker, booked } = await loadFixture(deployMeetingBookingFixture);
  
        await meetingBooking.connect(booker).registerUser();
        await meetingBooking.connect(booked).registerUser();
  
        const startTime = await time.latest() + 3600; // 1 hour from now
        const stakeAmount = ethers.parseEther("1");
  
        await expect(meetingBooking.connect(booker).bookMeeting(booked.address, startTime, { value: stakeAmount }))
          .to.emit(meetingBooking, "MeetingBooked")
          .withArgs(0, booker.address, booked.address, startTime);
      });
  
      it("Should not allow unregistered users to book a meeting", async function () {
        const { meetingBooking, booker, booked } = await loadFixture(deployMeetingBookingFixture);
  
        const startTime = await time.latest() + 3600;
        const stakeAmount = ethers.parseEther("1");
  
        await expect(meetingBooking.connect(booker).bookMeeting(booked.address, startTime, { value: stakeAmount }))
          .to.be.revertedWith("Booker not registered");
      });
    });
  
    describe("Check-in", function () {
      it("Should allow both parties to check in", async function () {
        const { meetingBooking, booker, booked } = await loadFixture(deployMeetingBookingFixture);
  
        await meetingBooking.connect(booker).registerUser();
        await meetingBooking.connect(booked).registerUser();
  
        const startTime = await time.latest() + 3600;
        const stakeAmount = ethers.parseEther("1");
  
        await meetingBooking.connect(booker).bookMeeting(booked.address, startTime, { value: stakeAmount });
  
        await time.increaseTo(startTime);
  
        await expect(meetingBooking.connect(booker).checkIn(0))
          .to.emit(meetingBooking, "UserCheckedIn")
          .withArgs(0, booker.address);
  
        await expect(meetingBooking.connect(booked).checkIn(0))
          .to.emit(meetingBooking, "UserCheckedIn")
          .withArgs(0, booked.address);
      });
  
      it("Should complete the meeting when both parties check in", async function () {
        const { meetingBooking, booker, booked } = await loadFixture(deployMeetingBookingFixture);
  
        await meetingBooking.connect(booker).registerUser();
        await meetingBooking.connect(booked).registerUser();
  
        const startTime = await time.latest() + 3600;
        const stakeAmount = ethers.parseEther("1");
  
        await meetingBooking.connect(booker).bookMeeting(booked.address, startTime, { value: stakeAmount });
  
        await time.increaseTo(startTime);
  
        await meetingBooking.connect(booker).checkIn(0);
        
        await expect(meetingBooking.connect(booked).checkIn(0))
          .to.emit(meetingBooking, "MeetingCompleted")
          .withArgs(0)
          .and.to.emit(meetingBooking, "StakeReturned")
          .withArgs(0, booker.address, stakeAmount);
      });
    });
  
    describe("Handle Ended Meeting", function () {
      it("Should allow anyone to handle an ended meeting", async function () {
        const { meetingBooking, booker, booked, owner } = await loadFixture(deployMeetingBookingFixture);
  
        await meetingBooking.connect(booker).registerUser();
        await meetingBooking.connect(booked).registerUser();
  
        const startTime = await time.latest() + 3600;
        const stakeAmount = ethers.parseEther("1");
  
        await meetingBooking.connect(booker).bookMeeting(booked.address, startTime, { value: stakeAmount });
  
        await time.increaseTo(startTime + 3600); // 1 hour after start time
  
        await expect(meetingBooking.connect(owner).handleEndedMeeting(0))
          .to.emit(meetingBooking, "MeetingCompleted")
          .withArgs(0)
          .and.to.emit(meetingBooking, "StakeReturned")
          .withArgs(0, booked.address, stakeAmount);
      });
    });
  });