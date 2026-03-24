const { execSync } = require('child_process');
const fs = require('fs');
try {
  execSync('npx tsc --noEmit', { encoding: 'utf-8' });
  fs.writeFileSync('tsc-errors.txt', 'Success');
} catch (error) {
  fs.writeFileSync('tsc-errors.txt', error.stdout || error.message);
}
