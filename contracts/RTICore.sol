// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract RTICore is ReentrancyGuard {
    enum RequestStatus { PENDING, RESPONDED, EXPIRED }
    
    struct RTIRequest {
        address requester;
        string department;
        string query;
        uint256 bounty;
        uint256 deadline;
        RequestStatus status;
        string responseCID; // IPFS CID for response
    }
    
    uint256 public requestCount;
    mapping(uint256 => RTIRequest) public requests;
    
    event RequestCreated(uint256 indexed requestId, address indexed requester, string department);
    event RequestFulfilled(uint256 indexed requestId, string responseCID);
    
    function createRequest(
        string memory _department,
        string memory _query,
        uint256 _daysToRespond
    ) external payable {
        require(msg.value > 0, "Bounty must be greater than 0");
        
        requests[requestCount] = RTIRequest({
            requester: msg.sender,
            department: _department,
            query: _query,
            bounty: msg.value,
            deadline: block.timestamp + (_daysToRespond * 1 days),
            status: RequestStatus.PENDING,
            responseCID: ""
        });
        
        emit RequestCreated(requestCount, msg.sender, _department);
        requestCount++;
    }
    
    function fulfillRequest(uint256 _requestId, string memory _responseCID) external nonReentrant {
        RTIRequest storage request = requests[_requestId];
        
        require(request.status == RequestStatus.PENDING, "Request not pending");
        require(block.timestamp <= request.deadline, "Deadline passed");
        
        request.status = RequestStatus.RESPONDED;
        request.responseCID = _responseCID;
        
        payable(msg.sender).transfer(request.bounty);
        emit RequestFulfilled(_requestId, _responseCID);
    }
}