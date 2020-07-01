module.exports = {
  apps: [
    {
      name: 'app',
      script: './build/src/app.js',
      instance_var: 'INSTANCE_ID',
      instances: '1', // typically -1 to scale to the number of available cores
      minUptime: '',
      autorestart: false,
      wait_ready: true,
      exec_mode: 'cluster',
    },
  ],
}
