export const handleSupabaseError = (error: any, context: string) => {
  console.error(`[${context}] Supabase Error:`, {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code
  });

  // User-friendly error messages
  const errorMessages: Record<string, string> = {
    'Invalid login credentials': 'Invalid email or password',
    'Email not confirmed': 'Please verify your email before signing in',
    'User already registered': 'This email is already registered',
    'Invalid email': 'Please enter a valid email address',
    '23505': 'This email or username is already taken',
  };

  for (const [key, message] of Object.entries(errorMessages)) {
    if (error.message?.includes(key) || error.code === key) {
      return message;
    }
  }

  return error.message || 'An unexpected error occurred';
};
