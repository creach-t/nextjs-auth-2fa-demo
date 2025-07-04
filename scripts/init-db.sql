-- Next.js Auth 2FA Demo - Database Initialization Script
-- This script initializes the PostgreSQL database for production

-- Create database if not exists (this would be done by Docker)
-- CREATE DATABASE IF NOT EXISTS nextjs_auth_2fa;

-- Use the database
\c nextjs_auth_2fa;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create indexes for better performance
-- These will be created by Prisma, but we can add additional ones

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON sessions(is_active);

CREATE INDEX IF NOT EXISTS idx_two_fa_codes_user_id ON two_fa_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_two_fa_codes_expires_at ON two_fa_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_two_fa_codes_code ON two_fa_codes(code);

CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_action ON rate_limits(identifier, action);
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_time ON rate_limits(reset_time);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON audit_logs(success);

-- Create a function to clean up expired data
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS INTEGER AS $$
DECLARE
    cleaned_codes INTEGER;
    cleaned_sessions INTEGER;
    cleaned_rate_limits INTEGER;
    cleaned_audit_logs INTEGER;
    total_cleaned INTEGER;
BEGIN
    -- Clean up expired 2FA codes
    DELETE FROM two_fa_codes WHERE expires_at < NOW();
    GET DIAGNOSTICS cleaned_codes = ROW_COUNT;
    
    -- Clean up expired sessions
    DELETE FROM sessions WHERE expires_at < NOW() OR is_active = false;
    GET DIAGNOSTICS cleaned_sessions = ROW_COUNT;
    
    -- Clean up expired rate limits
    DELETE FROM rate_limits WHERE reset_time < NOW();
    GET DIAGNOSTICS cleaned_rate_limits = ROW_COUNT;
    
    -- Clean up old audit logs (older than 90 days)
    DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days';
    GET DIAGNOSTICS cleaned_audit_logs = ROW_COUNT;
    
    total_cleaned := cleaned_codes + cleaned_sessions + cleaned_rate_limits + cleaned_audit_logs;
    
    -- Log the cleanup operation
    INSERT INTO audit_logs (action, details, success, created_at)
    VALUES (
        'automated_cleanup',
        json_build_object(
            'cleaned_codes', cleaned_codes,
            'cleaned_sessions', cleaned_sessions,
            'cleaned_rate_limits', cleaned_rate_limits,
            'cleaned_audit_logs', cleaned_audit_logs,
            'total_cleaned', total_cleaned
        )::text,
        true,
        NOW()
    );
    
    RETURN total_cleaned;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-expired-data', '0 2 * * *', 'SELECT cleanup_expired_data();');

-- Create a function to get database statistics
CREATE OR REPLACE FUNCTION get_database_stats()
RETURNS JSON AS $$
DECLARE
    stats JSON;
BEGIN
    SELECT json_build_object(
        'users', (SELECT COUNT(*) FROM users),
        'active_sessions', (SELECT COUNT(*) FROM sessions WHERE is_active = true AND expires_at > NOW()),
        'pending_2fa_codes', (SELECT COUNT(*) FROM two_fa_codes WHERE expires_at > NOW()),
        'rate_limit_entries', (SELECT COUNT(*) FROM rate_limits WHERE reset_time > NOW()),
        'audit_log_entries', (SELECT COUNT(*) FROM audit_logs),
        'database_size', pg_size_pretty(pg_database_size(current_database())),
        'last_updated', NOW()
    ) INTO stats;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
-- GRANT EXECUTE ON FUNCTION cleanup_expired_data() TO your_app_user;
-- GRANT EXECUTE ON FUNCTION get_database_stats() TO your_app_user;

-- Create a view for monitoring
CREATE OR REPLACE VIEW monitoring_dashboard AS
SELECT 
    'users' as metric,
    COUNT(*)::text as value,
    'Total registered users' as description
FROM users
UNION ALL
SELECT 
    'active_sessions',
    COUNT(*)::text,
    'Currently active sessions'
FROM sessions 
WHERE is_active = true AND expires_at > NOW()
UNION ALL
SELECT 
    'login_attempts_24h',
    COUNT(*)::text,
    'Login attempts in last 24 hours'
FROM audit_logs 
WHERE action IN ('login_success', 'login_invalid_password', 'login_user_not_found') 
    AND created_at > NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 
    'security_events_24h',
    COUNT(*)::text,
    'Security events in last 24 hours'
FROM audit_logs 
WHERE action LIKE 'security_%' 
    AND created_at > NOW() - INTERVAL '24 hours';

-- Initialize with a welcome message
INSERT INTO audit_logs (action, details, success, created_at)
VALUES (
    'database_initialized',
    'Database successfully initialized for Next.js Auth 2FA Demo',
    true,
    NOW()
);