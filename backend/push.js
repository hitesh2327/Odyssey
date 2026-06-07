const { execSync } = require('child_process');

try {
  console.log('Running prisma db push...');
  const output = execSync('npx prisma db push --accept-data-loss', { stdio: 'pipe' });
  console.log(output.toString());
  console.log('Running prisma generate...');
  const genOutput = execSync('npx prisma generate', { stdio: 'pipe' });
  console.log(genOutput.toString());
  console.log('Done!');
} catch (error) {
  console.error('Error:', error.message);
  if (error.stdout) console.error('Stdout:', error.stdout.toString());
  if (error.stderr) console.error('Stderr:', error.stderr.toString());
}
