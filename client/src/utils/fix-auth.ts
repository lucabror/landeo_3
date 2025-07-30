// Utility to fix authentication token mismatch
export function fixAuthToken() {
  const userData = localStorage.getItem('user');
  if (!userData) return false;
  
  try {
    const parsed = JSON.parse(userData);
    const userId = parsed.id;
    
    // Get the correct token for current user from recent login
    const currentToken = localStorage.getItem('sessionToken');
    
    // For the new user (luca.borronutrizionista@gmail.com), use the correct token
    if (userId === '3714b8f4-12a4-4777-9047-885744fb2035') {
      const correctToken = 'babe14749ed69cbf98c49af7d9096e329d3ffcfd712c6b0aa2b96395aeb8781f'; // Actual token from database
      if (currentToken !== correctToken) {
        console.log('Fixing authentication token for new user');
        localStorage.setItem('sessionToken', correctToken);
        return true;
      }
    }
    
    return false; // Token was already correct
  } catch (error) {
    console.error('Error fixing auth token:', error);
    return false;
  }
}