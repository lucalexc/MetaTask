const { execSync } = require('child_process');
const fs = require('fs');
try {
  const out = execSync('npx tsc --noEmit', { encoding: 'utf-8' });
  fs.writeFileSync('tsc-errors.txt', out || 'Success');
} catch (error) {
  fs.writeFileSync('tsc-errors.txt', error.stdout || error.message);
}
