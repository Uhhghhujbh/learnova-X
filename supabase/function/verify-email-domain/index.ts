import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_DOMAINS = ['gmail.com'] // Only Gmail allowed

serve(async (req) => {
  try {
    const { email, action } = await req.json()

    // Validate request
    if (!email || !action) {
      return new Response(
        JSON.stringify({ error: 'Email and action required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Extract domain from email
    const domain = email.split('@')[1]?.toLowerCase()

    // Check if domain is allowed
    if (!ALLOWED_DOMAINS.includes(domain)) {
      return new Response(
        JSON.stringify({ 
          error: 'Only Gmail accounts are allowed',
          allowed: false 
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check for disposable email services
    const disposableDomains = [
      'tempmail.com', 
      'guerrillamail.com', 
      '10minutemail.com',
      'throwaway.email'
    ]

    if (disposableDomains.some(d => domain.includes(d))) {
      return new Response(
        JSON.stringify({ 
          error: 'Disposable email addresses are not allowed',
          allowed: false 
        }),
   { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check if email already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('email, email_verified')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser) {
      if (existingUser.email_verified) {
        return new Response(
          JSON.stringify({ 
            error: 'Email already registered and verified',
            allowed: false 
          }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        )
      } else {
        // Email exists but not verified - allow resend
        if (action === 'resend_verification') {
          return new Response(
            JSON.stringify({ 
              message: 'Verification email can be resent',
              allowed: true 
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        }
      }
    }

    // Check rate limiting (max 5 signups per email domain per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    const { count, error: rateLimitError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('email', email.toLowerCase())
      .gte('created_at', oneHourAgo)

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError)
    }

    if (count && count >= 5) {
      return new Response(
        JSON.stringify({ 
          error: 'Too many signup attempts. Please try again later.',
          allowed: false 
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // All checks passed
    return new Response(
      JSON.stringify({ 
        message: 'Email verified successfully',
        allowed: true,
        domain: domain
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        allowed: false 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
