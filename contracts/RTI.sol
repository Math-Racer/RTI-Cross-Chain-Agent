// contracts/RTI.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RTI {
    enum Status { Pending, Responded, Rejected, Verified, Refunded }

    struct RTIRequest {
        address citizen;
        string title;
        string description;
        uint bounty;
        uint deadline;
        Status status;
        string responseText;
        address respondingOfficer;
    }

    address public admin;
    RTIRequest[] public rtiRequests;
    mapping(uint => bool) public isVerified;

    event RTICreated(uint indexed id, address indexed citizen, string title, uint bounty, uint deadline);
    event RTIResponded(uint indexed id, address indexed officer, string responseText);
    event RTIVerified(uint indexed id);
    event RTIRefunded(uint indexed id, address indexed citizen);

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlyOfficer() {
        // In a real implementation, we'd check officer role
        _;
    }

    function createRTI(string memory title, string memory description, uint deadline) public payable {
        require(msg.value > 0, "Bounty must be greater than 0");
        require(deadline > block.timestamp, "Deadline must be in the future");

        rtiRequests.push(RTIRequest({
            citizen: msg.sender,
            title: title,
            description: description,
            bounty: msg.value,
            deadline: deadline,
            status: Status.Pending,
            responseText: "",
            respondingOfficer: address(0)
        }));

        emit RTICreated(rtiRequests.length - 1, msg.sender, title, msg.value, deadline);
    }

    function submitResponse(uint rtiId, string memory responseText) public onlyOfficer {
        require(rtiId < rtiRequests.length, "Invalid RTI ID");
        RTIRequest storage request = rtiRequests[rtiId];
        require(request.status == Status.Pending, "RTI already processed");
        require(block.timestamp < request.deadline, "Deadline has passed");

        request.status = Status.Responded;
        request.responseText = responseText;
        request.respondingOfficer = msg.sender;

        emit RTIResponded(rtiId, msg.sender, responseText);
    }

    function rejectRequest(uint rtiId, string memory reason) public onlyOfficer {
        require(rtiId < rtiRequests.length, "Invalid RTI ID");
        RTIRequest storage request = rtiRequests[rtiId];
        require(request.status == Status.Pending, "RTI already processed");

        request.status = Status.Rejected;
        request.responseText = reason;
        request.respondingOfficer = msg.sender;
    }

    function verifyAndRelease(uint rtiId) public onlyAdmin {
        require(rtiId < rtiRequests.length, "Invalid RTI ID");
        RTIRequest storage request = rtiRequests[rtiId];
        require(request.status == Status.Responded, "RTI not responded yet");
        require(!isVerified[rtiId], "Already verified");

        isVerified[rtiId] = true;
        request.status = Status.Verified;
        
        payable(request.respondingOfficer).transfer(request.bounty);
        emit RTIVerified(rtiId);
    }

    function refundBounty(uint rtiId) public {
        require(rtiId < rtiRequests.length, "Invalid RTI ID");
        RTIRequest storage request = rtiRequests[rtiId];
        require(request.status == Status.Pending || request.status == Status.Rejected, "Cannot refund processed RTI");
        require(block.timestamp > request.deadline, "Deadline not yet passed");

        request.status = Status.Refunded;
        payable(request.citizen).transfer(request.bounty);
        emit RTIRefunded(rtiId, request.citizen);
    }

    function getRTICount() public view returns (uint) {
        return rtiRequests.length;
    }

    function getRTIDetails(uint rtiId) public view returns (
        address citizen,
        string memory title,
        string memory description,
        uint bounty,
        uint deadline,
        Status status,
        string memory responseText,
        address respondingOfficer
    ) {
        require(rtiId < rtiRequests.length, "Invalid RTI ID");
        RTIRequest storage request = rtiRequests[rtiId];
        return (
            request.citizen,
            request.title,
            request.description,
            request.bounty,
            request.deadline,
            request.status,
            request.responseText,
            request.respondingOfficer
        );
    }
}