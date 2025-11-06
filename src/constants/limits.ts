import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Rate limit configurations (actions per minute/hour)
const RATE_LIMITS: Record<string, { limit: number; window: number }> = {
  comment: { limit: 10, window: 60 }, // 10 per minute
  like: { limit: 30, window: 60 }, // 30 per minute
  post: { limit: 5, window: 3600 }, // 5 per hour (admins can post anytime)
  search: { limit: 60, window: 60 }, // 60 per minute
  report: { limit: 5, window: 3600 }, // 5 per hour
  pin: { limit: 3, window: 2592000 }, // 3 per 30 days
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const { user_id, action_type } = await req.json();

    // Validate inputs
    if (!user_id || !action_type) {
      return new Response(
        JSON.stringify({
          allowed: false,
          error: "User ID and action type required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const config = RATE_LIMITS[action_type];
    if (!config) {
      return new Response(
        JSON.stringify({
          allowed: false,
          error: `Invalid action type: ${action_type}`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase credentials");
      // Default to ALLOW to prevent service outages
      return new Response(
        JSON.stringify({
          allowed: true,
          message: "Service temporarily unavailable",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Calculate window start time
    const windowStart = new Date(Date.now() - config.window * 1000).toISOString();

    // Check if user exists
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", user_id)
      .single();

    if (userError || !userData) {
      console.error("User not found:", userError);
      return new Response(
        JSON.stringify({
          allowed: false,
          error: "User not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Admins bypass rate limiting for posts
    if (userData.role === "admin" && action_type === "post") {
      return new Response(
        JSON.stringify({
          allowed: true,
          message: "Admin bypass",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get action count in current window
    const { count, error: countError } = await supabase
      .from("rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user_id)
      .eq("action_type", action_type)
      .gte("window_start", windowStart);

    if (countError) {
      console.error("Count error:", countError);
      // Default to ALLOW if we can't check
      return new Response(
        JSON.stringify({
          allowed: true,
          message: "Unable to check rate limit",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const currentCount = count || 0;

    // Check if limit exceeded
    if (currentCount >= config.limit) {
      return new Response(
        JSON.stringify({
          allowed: false,
          message: `Rate limit exceeded. Maximum ${config.limit} ${action_type}(s) per ${
            config.window === 60 ? "minute" : config.window === 3600 ? "hour" : "30 days"
          }`,
          retry_after: config.window,
          limit: config.limit,
          remaining: 0,
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Log this action
    const { error: insertError } = await supabase.from("rate_limits").insert([
      {
        user_id,
        action_type,
        action_count: 1,
        window_start: new Date().toISOString(),
      },
    ]);

    if (insertError) {
      console.error("Insert error:", insertError);
      // Don't block even if logging fails
    }

    // Clean up old rate limit records (older than 24 hours)
    const cleanupTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await supabase
      .from("rate_limits")
      .delete()
      .lt("window_start", cleanupTime);

    // Success
    return new Response(
      JSON.stringify({
        allowed: true,
        message: "Request allowed",
        limit: config.limit,
        remaining: config.limit - currentCount - 1,
        retry_after: config.window,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Rate limit check error:", error);
    // Default to ALLOW to prevent service disruption
    return new Response(
      JSON.stringify({
        allowed: true,
        message: "Service error - allowing request",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
