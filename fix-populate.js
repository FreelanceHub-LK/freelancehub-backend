const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'modules', 'freelancers', 'freelancers.service.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace all patterns of .populate().exec() with the safe version
const oldPattern = /(\s+)const (\w+) = await this\.freelancerModel\s*\n\s*\.findByIdAndUpdate\([^)]+\)\s*\n\s*\.populate\('userId',\s*'firstName lastName email profilePicture rating reviewCount'\)\s*\n\s*\.exec\(\);/g;

content = content.replace(oldPattern, (match, indent, varName) => {
  const lines = match.split('\n');
  const findByIdAndUpdateLine = lines.find(line => line.includes('findByIdAndUpdate'));
  const updateCall = findByIdAndUpdateLine.trim().replace('const ' + varName + ' = await this.freelancerModel', '');
  
  return `${indent}const ${varName} = await this.executeQuerySafely(
${indent}  this.populateUserSafely(
${indent}    this.freelancerModel${updateCall}
${indent}  )
${indent});`;
});

fs.writeFileSync(filePath, content);
console.log('Fixed populate calls in freelancers.service.ts');
