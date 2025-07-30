// Utility to validate authentication token
export function fixAuthToken() {
  const userData = localStorage.getItem('user');
  if (!userData) return false;
  
  try {
    const parsed = JSON.parse(userData);
    const currentToken = localStorage.getItem('sessionToken');
    
    // If no token exists, user needs to re-authenticate
    if (!currentToken) {
      console.log('No authentication token found, user needs to log in');
      localStorage.removeItem('user');
      return false;
    }
    
    // Token exists, assume it's valid (server will validate on API calls)
    return true;
  } catch (error) {
    console.error('Error validating auth token:', error);
    // Clear potentially corrupted data
    localStorage.removeItem('user');
    localStorage.removeItem('sessionToken');
    return false;
  }
}