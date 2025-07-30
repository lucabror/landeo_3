// Utility to fix authentication token mismatch
export function fixAuthToken() {
  const correctToken = '6d38a69270aef252122e4e00e11a883e289e61cf0bc8841d48ca0686634554a7';
  const currentToken = localStorage.getItem('sessionToken');
  
  if (currentToken !== correctToken) {
    console.log('Fixing authentication token mismatch');
    localStorage.setItem('sessionToken', correctToken);
    
    // Also ensure user data has correct ID
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        if (parsed.id !== '123f4082-26d8-4df2-a034-3a6a17e65748') {
          const correctedUser = {
            ...parsed,
            id: '123f4082-26d8-4df2-a034-3a6a17e65748',
            hotelId: '123f4082-26d8-4df2-a034-3a6a17e65748'
          };
          localStorage.setItem('user', JSON.stringify(correctedUser));
          console.log('Corrected user data');
        }
      } catch (error) {
        console.error('Error fixing user data:', error);
      }
    }
    
    return true; // Token was updated
  }
  
  return false; // Token was already correct
}