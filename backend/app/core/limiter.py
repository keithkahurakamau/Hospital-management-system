from slowapi import Limiter
from slowapi.util import get_remote_address

# This initializes the rate limiter and tells it to track users by their IP address
limiter = Limiter(key_func=get_remote_address)