import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get all posts from last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .gte('created_at', sevenDaysAgo)
      .eq('banned', false)

    if (error) throw error

    if (!posts || posts.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No posts to update' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Calculate engagement scores
    const updates = posts.map(post => {
      const ageHours = (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60)
      const timeDecay = Math.pow(ageHours + 2, -1.5)
      
      const engagementScore = (
        (post.likes_count * 1.0) +
        (post.comments_count * 2.0) +
        (post.shares_count * 3.0) +
        (post.views_count * 0.1)
      ) * timeDecay

      return {
        id: post.id,
        engagement_score: engagementScore,
        is_trending: engagementScore > 10
      }
    })

    // Sort by engagement score
    updates.sort((a, b) => b.engagement_score - a.engagement_score)

    // Mark top 10 as trending
    const trendingPosts = updates.slice(0, 10)
    const nonTrendingPosts = updates.slice(10)

    // Update trending posts
    for (const post of trendingPosts) {
      await supabase
        .from('posts')
        .update({
          engagement_score: post.engagement_score,
          is_trending: true
        })
        .eq('id', post.id)
    }

    // Update non-trending posts
    for (const post of nonTrendingPosts) {
      await supabase
        .from('posts')
        .update({
          engagement_score: post.engagement_score,
          is_trending: false
        })
        .eq('id', post.id)
    }

    return new Response(
      JSON.stringify({
        message: 'Trending posts updated successfully',
        trending_count: trendingPosts.length,
        total_processed: posts.length
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Update trending error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to update trending posts' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
