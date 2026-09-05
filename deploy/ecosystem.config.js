const APP_DIR = '/var/www/nikstore'

module.exports = {
  apps: [
    {
      name:    'nikstore-backend',
      cwd:     `${APP_DIR}/nikstore`,
      script:  'node',
      args:    'dist/main',
      env_file: `${APP_DIR}/nikstore/.env`,
      instances:            1,
      autorestart:          true,
      watch:                false,
      max_memory_restart:   '512M',
      wait_ready:           true,
      listen_timeout:       30000,
      kill_timeout:         5000,
      error_file: '/var/log/pm2/backend-error.log',
      out_file:   '/var/log/pm2/backend-out.log',
    },
  ],
}
