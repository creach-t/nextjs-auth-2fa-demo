// PM2 ecosystem configuration for production deployment
module.exports = {
  apps: [
    {
      name: 'nextjs-auth-2fa-demo',
      script: './server.js',
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Logging
      log_file: './logs/app.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Auto-restart configuration
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
      
      // Monitoring
      monitoring: false,
      
      // Advanced features
      watch: false,
      ignore_watch: [
        'node_modules',
        'logs',
        '.next',
        '.git',
      ],
      
      // Health checks
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      
      // Environment variables
      env_file: '.env.production',
      
      // Cluster mode settings
      instance_var: 'INSTANCE_ID',
      
      // Performance
      node_args: '--max-old-space-size=2048',
      
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 8000,
      
      // Auto-restart triggers
      autorestart: true,
      restart_delay: 4000,
      
      // Time zone
      time: true,
    },
  ],
  
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'https://github.com/creach-t/nextjs-auth-2fa-demo.git',
      path: '/var/www/nextjs-auth-2fa-demo',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt update && apt install git -y',
    },
  },
}