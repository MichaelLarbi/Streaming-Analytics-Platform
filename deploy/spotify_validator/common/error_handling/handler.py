import json
import logging
import traceback
from typing import Any, Dict, Optional

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handle_error(error: Exception) -> Dict[str, Any]:
    logger.error(f"Error: {str(error)}")
    logger.error(f"Traceback: {''.join(traceback.format_tb(error.__traceback__))}")
    
    status_code = getattr(error, 'status_code', 500)
    message = getattr(error, 'message', 'Internal server error')
    
    return {
        'statusCode': status_code,
        'body': json.dumps({
            'error': True,
            'message': message,
            'type': error.__class__.__name__
        })
    }

def lambda_handler_wrapper(func):
    def wrapper(event: Dict[str, Any], context: Optional[Any] = None) -> Dict[str, Any]:
        try:
            return func(event, context)
        except Exception as e:
            return handle_error(e)
    return wrapper
