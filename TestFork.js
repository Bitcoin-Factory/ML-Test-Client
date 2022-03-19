//docker exec -it Bitcoin-Factory-ML python /tf/notebooks/Bitcoin_Factory_LSTM.py


const { spawn } = require('child_process');
const ls = spawn('docker', ['exec', 'Bitcoin-Factory-ML', 'python', '/tf/notebooks/Bitcoin_Factory_LSTM.py']);

ls.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

ls.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

ls.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});