"""
Gunicorn configuration for Sophisticat production deployment.

Environment variables allow tuning without modifying this file.

Recommended starting values:

    WEB_CONCURRENCY=(2 × CPU cores) + 1
    GUNICORN_THREADS=2
    GUNICORN_TIMEOUT=60

Monitor CPU and memory usage under production traffic and adjust as needed.
"""

import multiprocessing
import os


# -----------------------------------------------------------------------------
# Network
# -----------------------------------------------------------------------------

bind = f"0.0.0.0:{os.getenv('PORT', '8000')}"


# -----------------------------------------------------------------------------
# Worker Configuration
# -----------------------------------------------------------------------------

workers = int(
    os.getenv(
        "WEB_CONCURRENCY",
        multiprocessing.cpu_count() * 2 + 1,
    )
)

worker_class = "sync"

threads = int(os.getenv("GUNICORN_THREADS", 2))


# -----------------------------------------------------------------------------
# Worker Recycling
# -----------------------------------------------------------------------------
# Periodically restart workers to reduce the impact of memory leaks in third-
# party libraries. Jitter prevents all workers restarting simultaneously.

max_requests = int(os.getenv("GUNICORN_MAX_REQUESTS", 1000))
max_requests_jitter = int(os.getenv("GUNICORN_MAX_REQUESTS_JITTER", 100))


# -----------------------------------------------------------------------------
# Timeouts
# -----------------------------------------------------------------------------

timeout = int(os.getenv("GUNICORN_TIMEOUT", 60))

graceful_timeout = int(os.getenv("GUNICORN_GRACEFUL_TIMEOUT", 30))

keepalive = int(os.getenv("GUNICORN_KEEPALIVE", 5))


# -----------------------------------------------------------------------------
# Logging
# -----------------------------------------------------------------------------

accesslog = "-"
errorlog = "-"

capture_output = True

loglevel = os.getenv("GUNICORN_LOG_LEVEL", "info")

access_log_format = (
    '%(h)s %(l)s %(u)s "%(r)s" %(s)s %(b)s '
    '%(D)sus "%(f)s" "%(a)s"'
)


# -----------------------------------------------------------------------------
# Proxy
# -----------------------------------------------------------------------------
# Nginx terminates HTTPS and forwards requests to Gunicorn.

forwarded_allow_ips = os.getenv("FORWARDED_ALLOW_IPS", "*")

secure_scheme_headers = {
    "X-Forwarded-Proto": "https",
}


# -----------------------------------------------------------------------------
# Process Naming
# -----------------------------------------------------------------------------

proc_name = "sophisticat"


# -----------------------------------------------------------------------------
# Temporary Files
# -----------------------------------------------------------------------------
# Store worker temp files in memory instead of disk.

worker_tmp_dir = "/dev/shm"


# -----------------------------------------------------------------------------
# Security
# -----------------------------------------------------------------------------

limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190


# -----------------------------------------------------------------------------
# Server Information
# -----------------------------------------------------------------------------

preload_app = False