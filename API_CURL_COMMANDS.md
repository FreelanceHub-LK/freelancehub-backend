# FreelanceHub API - Complete cURL Commands Reference

This document contains all the cURL commands for testing the FreelanceHub API endpoints.

## Environment Variables
First, set these environment variables:
```bash
export BASE_URL="http://localhost:8000"
export ACCESS_TOKEN="your_jwt_token_here"
export ADMIN_TOKEN="admin_jwt_token_here"
```

## Authentication Endpoints

### 1. Register User
```bash
curl -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe", 
    "email": "john.doe@example.com",
    "password": "securePassword123",
    "role": "FREELANCER",
    "phoneNumber": "+94771234567"
  }'
```

### 2. Login
```bash
curl -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "securePassword123"
  }'
```

### 3. Send OTP
```bash
curl -X POST "$BASE_URL/auth/send-otp" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "purpose": "EMAIL_VERIFICATION"
  }'
```

### 4. Verify OTP
```bash
curl -X POST "$BASE_URL/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "otp": "123456",
    "purpose": "EMAIL_VERIFICATION"
  }'
```

### 5. Refresh Token
```bash
curl -X POST "$BASE_URL/auth/refresh-token" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your_refresh_token"
  }'
```

### 6. Google Login
```bash
curl -X GET "$BASE_URL/auth/google"
```

### 7. Google Login Direct
```bash
curl -X POST "$BASE_URL/auth/google/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@gmail.com",
    "firstName": "John",
    "lastName": "Doe",
    "googleId": "google_user_id",
    "picture": "https://profile-picture-url.jpg"
  }'
```

## Passkey Endpoints

### 8. Initiate Passkey Registration
```bash
curl -X POST "$BASE_URL/auth/passkeys/register/initiate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "deviceName": "My Device"
  }'
```

### 9. Complete Passkey Registration
```bash
curl -X POST "$BASE_URL/auth/passkeys/register/complete" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "credential": {
      "id": "credential_id",
      "rawId": "raw_id",
      "response": {
        "attestationObject": "attestation_object",
        "clientDataJSON": "client_data_json"
      },
      "type": "public-key"
    }
  }'
```

### 10. Get User Passkeys
```bash
curl -X GET "$BASE_URL/auth/passkeys" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 11. Delete Passkey
```bash
curl -X DELETE "$BASE_URL/auth/passkeys/{passkey_id}" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## User Management Endpoints

### 12. Get All Users
```bash
curl -X GET "$BASE_URL/users?page=1&limit=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 13. Get User by ID
```bash
curl -X GET "$BASE_URL/users/{user_id}" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 14. Get User by Email
```bash
curl -X GET "$BASE_URL/users/email/{email}" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 15. Create User
```bash
curl -X POST "$BASE_URL/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@example.com",
    "password": "securePassword123",
    "role": "CLIENT",
    "phoneNumber": "+94771234568"
  }'
```

### 16. Update User
```bash
curl -X PUT "$BASE_URL/users/{user_id}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "firstName": "Updated John",
    "lastName": "Updated Doe",
    "phoneNumber": "+94771234569"
  }'
```

### 17. Delete User
```bash
curl -X DELETE "$BASE_URL/users/{user_id}" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## Project Endpoints

### 18. Create Project
```bash
curl -X POST "$BASE_URL/projects" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "title": "Website Development Project",
    "description": "Need a modern responsive website for my business",
    "budget": {
      "min": 50000,
      "max": 100000
    },
    "deadline": "2024-12-31T23:59:59.000Z",
    "skills": ["React", "Node.js", "MongoDB"],
    "category": "category_id_here",
    "type": "FIXED",
    "priority": "MEDIUM"
  }'
```

### 19. Get All Projects
```bash
curl -X GET "$BASE_URL/projects?page=1&limit=10&status=OPEN&minBudget=10000&maxBudget=100000" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 20. Get Project by ID
```bash
curl -X GET "$BASE_URL/projects/{project_id}" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 21. Update Project
```bash
curl -X PATCH "$BASE_URL/projects/{project_id}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "title": "Updated Website Development Project",
    "description": "Updated description for the project",
    "status": "IN_PROGRESS"
  }'
```

### 22. Delete Project
```bash
curl -X DELETE "$BASE_URL/projects/{project_id}" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## Proposal Endpoints

### 23. Create Proposal
```bash
curl -X POST "$BASE_URL/proposals" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "project": "project_id_here",
    "bidAmount": 75000,
    "deliveryDays": 30,
    "coverLetter": "I am excited to work on your project. I have extensive experience in web development and can deliver high-quality results.",
    "attachments": ["portfolio_sample1.pdf", "portfolio_sample2.jpg"]
  }'
```

### 24. Get All Proposals
```bash
curl -X GET "$BASE_URL/proposals?page=1&limit=10&status=PENDING" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 25. Get My Proposals
```bash
curl -X GET "$BASE_URL/proposals/my-proposals?page=1&limit=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 26. Get Proposals for Project
```bash
curl -X GET "$BASE_URL/proposals/project/{project_id}?page=1&limit=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 27. Get Proposal Statistics
```bash
curl -X GET "$BASE_URL/proposals/statistics" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 28. Get Proposal by ID
```bash
curl -X GET "$BASE_URL/proposals/{proposal_id}" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 29. Update Proposal
```bash
curl -X PATCH "$BASE_URL/proposals/{proposal_id}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "bidAmount": 80000,
    "deliveryDays": 25,
    "coverLetter": "Updated proposal with better pricing and faster delivery."
  }'
```

### 30. Accept Proposal
```bash
curl -X PATCH "$BASE_URL/proposals/{proposal_id}/accept" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "message": "Welcome aboard! Looking forward to working with you."
  }'
```

### 31. Reject Proposal
```bash
curl -X PATCH "$BASE_URL/proposals/{proposal_id}/reject" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "reason": "Thank you for your proposal, but we have decided to go with another freelancer."
  }'
```

### 32. Withdraw Proposal
```bash
curl -X PATCH "$BASE_URL/proposals/{proposal_id}/withdraw" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "reason": "I need to withdraw my proposal due to other commitments."
  }'
```

### 33. Delete Proposal
```bash
curl -X DELETE "$BASE_URL/proposals/{proposal_id}" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## Freelancer Endpoints

### 34. Create Freelancer Profile
```bash
curl -X POST "$BASE_URL/freelancers" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "title": "Full Stack Developer",
    "bio": "Experienced full stack developer with 5+ years in web development",
    "skills": ["React", "Node.js", "MongoDB", "TypeScript"],
    "hourlyRate": 2500,
    "languages": ["English", "Sinhala"],
    "education": [{
      "degree": "BSc Computer Science",
      "institution": "University of Colombo",
      "year": 2018
    }],
    "experience": [{
      "title": "Senior Developer",
      "company": "Tech Solutions",
      "duration": "2020-2024",
      "description": "Led development of web applications"
    }],
    "portfolio": [{
      "title": "E-commerce Platform",
      "description": "Modern e-commerce solution",
      "technologies": ["React", "Node.js"],
      "link": "https://portfolio.example.com"
    }]
  }'
```

### 35. Get All Freelancers
```bash
curl -X GET "$BASE_URL/freelancers?page=1&limit=10&skills=React,Node.js&minRate=1000&maxRate=5000" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 36. Get My Freelancer Profile
```bash
curl -X GET "$BASE_URL/freelancers/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 37. Get Freelancer Dashboard
```bash
curl -X GET "$BASE_URL/freelancers/dashboard" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 38. Get Top Rated Freelancers
```bash
curl -X GET "$BASE_URL/freelancers/top-rated?limit=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 39. Get Freelancers by Skill
```bash
curl -X GET "$BASE_URL/freelancers/by-skill/javascript?page=1&limit=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 40. Get Freelancer by ID
```bash
curl -X GET "$BASE_URL/freelancers/{freelancer_id}" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 41. Update My Freelancer Profile
```bash
curl -X PATCH "$BASE_URL/freelancers/me" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "title": "Senior Full Stack Developer",
    "bio": "Updated bio with more experience",
    "hourlyRate": 3000
  }'
```

### 42. Add Skills to Profile
```bash
curl -X POST "$BASE_URL/freelancers/me/skills" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "skills": ["Python", "Django", "PostgreSQL"]
  }'
```

### 43. Remove Skill from Profile
```bash
curl -X DELETE "$BASE_URL/freelancers/me/skills/{skill_name}" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 44. Update Availability
```bash
curl -X PATCH "$BASE_URL/freelancers/me/availability" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "isAvailable": true,
    "availabilityNote": "Available for new projects starting next week"
  }'
```

## Client Endpoints

### 45. Create Client Profile
```bash
curl -X POST "$BASE_URL/clients" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "companyName": "Tech Innovations Ltd",
    "industry": "Technology",
    "companySize": "MEDIUM",
    "description": "Leading technology company specializing in digital solutions",
    "website": "https://techinnovations.lk",
    "location": "Colombo, Sri Lanka",
    "registrationNumber": "PV12345"
  }'
```

### 46. Get All Clients
```bash
curl -X GET "$BASE_URL/clients?page=1&limit=10&industry=Technology" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 47. Get My Client Profile
```bash
curl -X GET "$BASE_URL/clients/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 48. Get Top Rated Clients
```bash
curl -X GET "$BASE_URL/clients/top-rated?limit=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 49. Get Clients by Industry
```bash
curl -X GET "$BASE_URL/clients/by-industry/Technology?page=1&limit=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 50. Update My Client Profile
```bash
curl -X PATCH "$BASE_URL/clients/me" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "companyName": "Updated Tech Innovations Ltd",
    "description": "Updated company description"
  }'
```

## Contract Endpoints

### 51. Create Contract
```bash
curl -X POST "$BASE_URL/contracts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "title": "Website Development Contract",
    "description": "Contract for developing a modern responsive website",
    "type": "FIXED_PRICE",
    "amount": 100000,
    "currency": "LKR",
    "startDate": "2024-09-01T00:00:00.000Z",
    "endDate": "2024-12-01T00:00:00.000Z",
    "projectId": "project_id_here",
    "clientId": "client_id_here",
    "freelancerId": "freelancer_id_here",
    "terms": "Standard freelance contract terms and conditions",
    "scope": "Full website development including frontend and backend",
    "paymentTerms": "50% upfront, 50% on completion",
    "milestones": [
      {
        "title": "Design Phase",
        "description": "Complete UI/UX design",
        "amount": 50000,
        "dueDate": "2024-09-30T00:00:00.000Z"
      },
      {
        "title": "Development Phase", 
        "description": "Complete development and testing",
        "amount": 50000,
        "dueDate": "2024-11-30T00:00:00.000Z"
      }
    ]
  }'
```

### 52. Get All Contracts
```bash
curl -X GET "$BASE_URL/contracts?page=1&limit=10&status=ACTIVE&type=FIXED_PRICE" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 53. Get Contract by ID
```bash
curl -X GET "$BASE_URL/contracts/{contract_id}" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 54. Update Contract
```bash
curl -X PATCH "$BASE_URL/contracts/{contract_id}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "title": "Updated Contract Title",
    "description": "Updated contract description",
    "status": "IN_PROGRESS"
  }'
```

### 55. Sign Contract
```bash
curl -X POST "$BASE_URL/contracts/{contract_id}/sign" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "userType": "CLIENT",
    "ipAddress": "192.168.1.1"
  }'
```

### 56. Download Contract PDF
```bash
curl -X GET "$BASE_URL/contracts/{contract_id}/download-pdf" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -o contract.pdf
```

### 57. Update Milestone
```bash
curl -X PATCH "$BASE_URL/contracts/{contract_id}/milestones/0" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "title": "Updated Milestone Title",
    "description": "Updated milestone description",
    "amount": 60000,
    "status": "IN_PROGRESS"
  }'
```

## Payment Endpoints

### 58. Create Payment
```bash
curl -X POST "$BASE_URL/payments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "amount": 50000,
    "currency": "LKR",
    "contractId": "contract_id_here",
    "payerId": "payer_user_id",
    "payeeId": "payee_user_id", 
    "description": "Payment for project milestone 1",
    "paymentMethod": "STRIPE"
  }'
```

### 59. Get All Payments
```bash
curl -X GET "$BASE_URL/payments?page=1&limit=10&status=PENDING" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 60. Get Payment by ID
```bash
curl -X GET "$BASE_URL/payments/{payment_id}" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 61. Update Payment Status
```bash
curl -X PATCH "$BASE_URL/payments/{payment_id}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "status": "COMPLETED",
    "notes": "Payment completed successfully"
  }'
```

## Review Endpoints

### 62. Create Review
```bash
curl -X POST "$BASE_URL/reviews" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "projectId": "project_id_here",
    "revieweeId": "reviewee_user_id",
    "rating": 5,
    "comment": "Excellent work! Very professional and delivered on time.",
    "skills": {
      "communication": 5,
      "quality": 5,
      "timeliness": 5,
      "professionalism": 5
    }
  }'
```

### 63. Get All Reviews
```bash
curl -X GET "$BASE_URL/reviews?page=1&limit=10&rating=4" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 64. Get Review Statistics for User
```bash
curl -X GET "$BASE_URL/reviews/stats/{user_id}" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 65. Get Reviews for User
```bash
curl -X GET "$BASE_URL/reviews/user/{user_id}?page=1&limit=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 66. Get Reviews for Project
```bash
curl -X GET "$BASE_URL/reviews/project/{project_id}?page=1&limit=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 67. Update Review
```bash
curl -X PATCH "$BASE_URL/reviews/{review_id}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "rating": 4,
    "comment": "Updated review: Good work overall with minor improvements needed."
  }'
```

### 68. Respond to Review
```bash
curl -X POST "$BASE_URL/reviews/{review_id}/respond" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "response": "Thank you for the positive feedback! It was a pleasure working with you."
  }'
```

### 69. Flag Review
```bash
curl -X POST "$BASE_URL/reviews/{review_id}/flag" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "reason": "INAPPROPRIATE_CONTENT",
    "description": "This review contains inappropriate language"
  }'
```

## Dispute Endpoints

### 70. Create Dispute
```bash
curl -X POST "$BASE_URL/disputes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "title": "Quality Issues with Delivered Work",
    "description": "The delivered work does not meet the requirements specified in the contract",
    "type": "QUALITY_ISSUE",
    "contractId": "contract_id_here",
    "amount": 50000,
    "evidence": ["screenshot1.jpg", "requirements_doc.pdf"],
    "desiredResolution": "Full refund or rework of the project"
  }'
```

### 71. Get All Disputes
```bash
curl -X GET "$BASE_URL/disputes?page=1&limit=10&status=OPEN&type=QUALITY_ISSUE" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 72. Get Dispute Statistics
```bash
curl -X GET "$BASE_URL/disputes/statistics?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 73. Get Dispute by ID
```bash
curl -X GET "$BASE_URL/disputes/{dispute_id}" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 74. Add Dispute Response
```bash
curl -X POST "$BASE_URL/disputes/{dispute_id}/responses" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "message": "I believe the work was delivered according to specifications. Here is my evidence.",
    "evidence": ["work_samples.zip", "communication_log.pdf"]
  }'
```

### 75. Escalate Dispute
```bash
curl -X POST "$BASE_URL/disputes/{dispute_id}/escalate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "reason": "Unable to reach agreement through direct communication",
    "priority": "HIGH"
  }'
```

### 76. Resolve Dispute (Admin)
```bash
curl -X POST "$BASE_URL/disputes/{dispute_id}/resolve" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "resolution": "PARTIAL_REFUND",
    "refundAmount": 25000,
    "reasoning": "Based on evidence, partial work was completed satisfactorily"
  }'
```

## Message Endpoints

### 77. Send Message
```bash
curl -X POST "$BASE_URL/messages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "recipientId": "recipient_user_id",
    "content": "Hello, I am interested in your project proposal.",
    "conversationId": "conversation_id",
    "messageType": "TEXT"
  }'
```

### 78. Get Messages
```bash
curl -X GET "$BASE_URL/messages?conversationId=conversation_id&page=1&limit=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 79. Get Unread Message Count
```bash
curl -X GET "$BASE_URL/messages/unread-count" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 80. Create Conversation
```bash
curl -X POST "$BASE_URL/messages/conversations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "participants": ["user_id_1", "user_id_2"],
    "title": "Project Discussion",
    "type": "DIRECT",
    "projectId": "project_id_here"
  }'
```

### 81. Get My Conversations
```bash
curl -X GET "$BASE_URL/messages/conversations?page=1&limit=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## Category Endpoints

### 82. Get All Categories
```bash
curl -X GET "$BASE_URL/categories"
```

### 83. Get Active Categories
```bash
curl -X GET "$BASE_URL/categories/active"
```

### 84. Get Main Categories
```bash
curl -X GET "$BASE_URL/categories/main"
```

### 85. Get Subcategories
```bash
curl -X GET "$BASE_URL/categories/sub/{parent_category_id}"
```

### 86. Search Categories by Name
```bash
curl -X GET "$BASE_URL/categories/search?name=web%20development"
```

### 87. Create Category (Admin)
```bash
curl -X POST "$BASE_URL/categories" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "Web Development",
    "description": "All types of web development services",
    "parentId": null,
    "isActive": true
  }'
```

## Skill Endpoints

### 88. Get All Skills
```bash
curl -X GET "$BASE_URL/skills"
```

### 89. Get Popular Skills
```bash
curl -X GET "$BASE_URL/skills/popular?limit=10"
```

### 90. Search Skills by Name
```bash
curl -X GET "$BASE_URL/skills/search?name=javascript"
```

### 91. Get Skills by Category
```bash
curl -X GET "$BASE_URL/skills/category/{category_id}"
```

### 92. Create Skill (Admin)
```bash
curl -X POST "$BASE_URL/skills" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "React.js",
    "description": "JavaScript library for building user interfaces",
    "category": "category_id_here",
    "isActive": true
  }'
```

## Notification Endpoints

### 93. Get My Notifications
```bash
curl -X GET "$BASE_URL/notifications/my?page=1&limit=10&unreadOnly=false" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 94. Get My Notification Stats
```bash
curl -X GET "$BASE_URL/notifications/stats" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 95. Mark Notification as Read
```bash
curl -X PATCH "$BASE_URL/notifications/{notification_id}/read" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 96. Mark All Notifications as Read
```bash
curl -X PATCH "$BASE_URL/notifications/read-all" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 97. Create Notification (Admin)
```bash
curl -X POST "$BASE_URL/notifications" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "title": "System Maintenance",
    "message": "Scheduled system maintenance will occur tonight",
    "type": "SYSTEM",
    "recipientId": "user_id_here"
  }'
```

## File Upload Endpoints

### 98. Upload Single File
```bash
curl -X POST "$BASE_URL/file-upload/single?folder=general" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "file=@/path/to/your/file.pdf"
```

### 99. Upload Multiple Files
```bash
curl -X POST "$BASE_URL/file-upload/multiple?folder=general" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "files=@/path/to/file1.pdf" \
  -F "files=@/path/to/file2.jpg"
```

### 100. Delete File
```bash
curl -X DELETE "$BASE_URL/file-upload/{file_id}" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## Analytics Endpoints

### 101. Get Platform Statistics (Admin)
```bash
curl -X GET "$BASE_URL/analytics/platform" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 102. Get User Analytics
```bash
curl -X GET "$BASE_URL/analytics/user/{user_id}" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 103. Get My Analytics
```bash
curl -X GET "$BASE_URL/analytics/my-analytics" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 104. Get Revenue Analytics (Admin)
```bash
curl -X GET "$BASE_URL/analytics/revenue?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 105. Get Top Performers (Admin)
```bash
curl -X GET "$BASE_URL/analytics/top-performers" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## API Info Endpoint

### 106. Get API Info
```bash
curl -X GET "$BASE_URL/"
```

---

## Testing Workflow

### 1. Start by registering a user:
```bash
# Register as freelancer
curl -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "freelancer@example.com", 
    "password": "password123",
    "role": "FREELANCER"
  }'

# Register as client
curl -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "client@example.com",
    "password": "password123", 
    "role": "CLIENT"
  }'
```

### 2. Login to get access tokens:
```bash
# Login as freelancer
ACCESS_TOKEN_FREELANCER=$(curl -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "freelancer@example.com",
    "password": "password123"
  }' | jq -r '.accessToken')

# Login as client  
ACCESS_TOKEN_CLIENT=$(curl -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@example.com", 
    "password": "password123"
  }' | jq -r '.accessToken')
```

### 3. Create profiles:
```bash
# Create freelancer profile
curl -X POST "$BASE_URL/freelancers" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN_FREELANCER" \
  -d '{
    "title": "Full Stack Developer",
    "bio": "Experienced developer",
    "skills": ["React", "Node.js"],
    "hourlyRate": 2500
  }'

# Create client profile
curl -X POST "$BASE_URL/clients" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN_CLIENT" \
  -d '{
    "companyName": "Tech Company",
    "industry": "Technology",
    "companySize": "MEDIUM"
  }'
```

### 4. Create and manage projects:
```bash
# Client creates project
PROJECT_ID=$(curl -X POST "$BASE_URL/projects" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN_CLIENT" \
  -d '{
    "title": "Website Development",
    "description": "Need a modern website", 
    "budget": {"min": 50000, "max": 100000},
    "skills": ["React", "Node.js"]
  }' | jq -r '.id')

# Freelancer submits proposal
PROPOSAL_ID=$(curl -X POST "$BASE_URL/proposals" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN_FREELANCER" \
  -d '{
    "project": "'$PROJECT_ID'",
    "bidAmount": 75000,
    "deliveryDays": 30,
    "coverLetter": "I can build your website"
  }' | jq -r '.id')

# Client accepts proposal
curl -X PATCH "$BASE_URL/proposals/$PROPOSAL_ID/accept" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN_CLIENT" \
  -d '{
    "message": "Welcome aboard!"
  }'
```

This completes the comprehensive cURL command reference for the FreelanceHub API!
