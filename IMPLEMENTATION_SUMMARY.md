# PromptShield API Key Creation Implementation Summary

## Overview
This implementation adds functionality to create API keys for applications when they are added via the tool, fulfilling the user's request: "i want to add funtionality of creating api keys for each application we add in tool".

## Changes Made

### 1. Enhanced Application Creation Endpoint (`/backend/app/api/applications.py`)
- Added `create_api_key` boolean parameter (defaults to False) to the POST `/applications/` endpoint
- When `create_api_key=true`:
  - Creates the application
  - Creates a usage metric for the application
  - Creates an API key for the application with default name "Default Key for {application_name}"
  - Returns the full API key (only once for security) along with API key metadata
  - Uses a single database transaction for all operations to ensure data consistency
- Fixed duplicate imports and added necessary imports for `secrets` and `hashlib`
- Maintains backward compatibility - existing code without the parameter works unchanged

### 2. Secured Application Keys Endpoint (`/backend/app/api/application_keys.py`)
- Added authentication requirement (current_user dependency)
- Added authorization check to ensure users can only create API keys for their own applications
- Fixed missing user_id and prefix fields in API key creation
- Added proper error handling (404) for non-existent or inaccessible applications

## Usage Instructions

### For the Tool Integration
When your tool adds an application and needs to create an API Key for it:

**Option 1: Query Parameter (Recommended for tools)**
```
POST /applications/?create_api_key=true
{
    "name": "My Application",
    "description": "A test application",
    "environment": "production",
    "provider": "openai"
}
```

**Option 2: Request Body Field**
```
POST /applications/
{
    "name": "My Application",
    "description": "A test application",
    "environment": "production",
    "provider": "openai",
    "create_api_key": true
}
```

### Response Format
When `create_api_key=true`, the response includes:
```json
{
    "id": "application-uuid",
    "user_id": "user-uuid", 
    "name": "My Application",
    "description": "A test application",
    "environment": "production",
    "provider": "openai",
    "is_active": true,
    "created_at": "timestamp",
    "api_key": {
        "api_key": "ps_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",  // FULL KEY (only shown once)
        "api_key_info": {
            "id": "api-key-uuid",
            "name": "Default Key for My Application",
            "prefix": "ps_xxxx...",
            "created_at": "timestamp",
            "last_used_at": null,
            "is_active": true
        }
    }
}
```

When `create_api_key=false` or omitted, returns standard application object (backward compatible).

### How to See the API Key in the UI
When using the PromptShield web application:

1. Navigate to the **Applications** page.
2. Fill in the application name and description.
3. Check the checkbox labeled **"Also create API key"**.
4. Click the **"Create Application"** button.
5. If successful, a modal will appear displaying the full API key.
6. **IMPORTANT**: Copy the API key immediately as it will not be displayed again for security reasons.
7. Click **"Close"** to dismiss the modal.

The API key is stored securely in the database (hashed) and cannot be retrieved in full afterward. If you need to use the API key, you must copy it at the time of creation. To obtain a new API key for an application, you can regenerate one by:
- Deleting the existing API key (via the API Keys page or backend API) and creating a new one, or
- Creating a new application with the "Also create API key" option checked.

### Security Notes
- The full API key is only returned once in the API response and is never stored or re-exposed by the server.
- The UI follows the same security principle by showing the key only once in a modal after creation.
- Always store API keys securely and treat them as sensitive credentials.

## Security Features
- API key is only returned once (never stored or returned again)
- Proper authentication and authorization checks
- Single database transaction prevents partial creations
- User isolation - users can only create API keys for their own applications
- Standard API key format: `ps_{url-safe-token}` (32 bytes entropy)

## Backward Compatibility
- All existing functionality remains unchanged
- New parameter is optional and defaults to False
- Existing integrations will continue to work without modification
- Response structure for existing fields is unchanged

## Files Modified
1. `/backend/app/api/applications.py` - Enhanced application creation with API key option
2. `/backend/app/api/application_keys.py` - Fixed security and functionality issues

## Testing
Syntax verified for all modified files. No breaking changes introduced.