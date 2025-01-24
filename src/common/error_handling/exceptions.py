class APIError(Exception):
    """Base exception for API related errors"""
    def __init__(self, message, status_code=500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class RateLimitError(APIError):
    """Raised when API rate limit is exceeded"""
    def __init__(self, message="Rate limit exceeded"):
        super().__init__(message, status_code=429)

class AuthenticationError(APIError):
    """Raised when API authentication fails"""
    def __init__(self, message="Authentication failed"):
        super().__init__(message, status_code=401)

class ValidationError(APIError):
    """Raised when data validation fails"""
    def __init__(self, message="Data validation failed"):
        super().__init__(message, status_code=400)