// Test script for freelancer profile management endpoints
// This demonstrates how to use the new endpoints

const API_BASE = 'http://localhost:3000/freelancers';

// Example requests for the new endpoints:

// 1. Update Skills
const updateSkills = {
  method: 'PUT',
  url: `${API_BASE}/me/skills`,
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    skills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'MongoDB']
  })
};

// 2. Update Hourly Rate
const updateRate = {
  method: 'PUT',
  url: `${API_BASE}/me/rate`,
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    hourlyRate: 45.00
  })
};

// 3. Update Education
const updateEducation = {
  method: 'PUT',
  url: `${API_BASE}/me/education`,
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    education: 'Bachelor of Science in Computer Science, Stanford University'
  })
};

// 4. Update Availability
const updateAvailability = {
  method: 'PUT',
  url: `${API_BASE}/me/availability`,
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    isAvailable: true
  })
};

// 5. Update Certifications
const updateCertifications = {
  method: 'PUT',
  url: `${API_BASE}/me/certifications`,
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    certifications: [
      'AWS Certified Developer',
      'Microsoft Azure Fundamentals',
      'Google Cloud Professional Developer'
    ]
  })
};

// 6. Update Portfolio Links
const updatePortfolio = {
  method: 'PUT',
  url: `${API_BASE}/me/portfolio`,
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    portfolioLinks: [
      'https://github.com/username/awesome-project',
      'https://myportfolio.dev',
      'https://dribbble.com/username'
    ]
  })
};

console.log('Freelancer Profile Management Endpoints:');
console.log('=====================================');
console.log('1. Update Skills:', updateSkills);
console.log('2. Update Rate:', updateRate);
console.log('3. Update Education:', updateEducation);
console.log('4. Update Availability:', updateAvailability);
console.log('5. Update Certifications:', updateCertifications);
console.log('6. Update Portfolio:', updatePortfolio);
