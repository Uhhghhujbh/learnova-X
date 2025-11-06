import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Rate limit configurations (actions per minute)
const RATE_LIMITS = {
  comment: { limit: 10, window: 60 }, // 10 per minute
  like: { limit: 30, window: 60 }, // 30 per minute
  post: { limit: 5, window: 3600 }, // 5 per hour
  search: { limit: 60, window: 60 }, // 60 per minute
  report: { limit: 5, window: 3600 } // 5 per hour
}

serve(async (req) => {
  try {
    const { user_id, action_type } = await req.json()

    if (!user_id || !action_type) {
      return new Response(
        JSON.stringify({ error: 'User ID and action type required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const config = RATE_LIMITS[action_type as keyof typeof RATE_LIMITS]
    if (!config) {
      return new Response(
        JSON.stringify({ error: 'Invalid action type' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const windowStart = new Date(Date.now() - config.window * 1000).toISOString()

    // Get action count in current window
    const { count, error } = await supabase
      .from('rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id)
      .eq('action_type', action_type)
      .gte('window_start', windowStart)

    if (error) {
      throw error
    }

    if (count && count >= config.limit) {
      return new Response(
        JSON.stringify({
          allowed: false,
          message: `Rate limit exceeded. Maximum ${config.limit} ${action_type}s per ${config.window / 60} minute(s).`,
          retry_after: config.window
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Log this action
    await supabase
      .from('rate_limits')
      .insert([{
        user_id,
        action_type,
        action_count: 1,
        window_start: new Date().toISOString()
      }])

    // Clean up old rate limit records (older than 24 hours)
    const cleanupTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    await supabase
      .from('rate_limits')
      .delete()
      .lt('window_start', cleanupTime)

    return new Response(
      JSON.stringify({
        allowed: true,
        remaining: config.limit - (count || 0) - 1,
        limit: config.limit
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Rate limit check error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', allowed: true }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
