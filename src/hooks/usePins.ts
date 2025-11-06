import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { Pin, Post } from '../types';
import { LIMITS } from '../constants/limits';

export function usePins() {
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Always call useEffect - never conditionally
  useEffect(() => {
    // Only fetch if user exists
    if (user) {
      fetchPins();
    } else {
      // Clear pins when no user
      setPins([]);
    }
  }, [user?.id]); // Only depend on user.id, not entire user object

  const fetchPins = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('pins')
      .select('*, posts(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPins(data);
    }
    setLoading(false);
  };

  const canPinMore = async (): Promise<boolean> => {
    if (!user) return false;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count, error } = await supabase
      .from('pins')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', thirtyDaysAgo.toISOString());

    return !error && (count || 0) < LIMITS.PIN_MAX_PER_30_DAYS;
  };

  const togglePin = async (postId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    const existingPin = pins.find(p => p.post_id === postId);

    if (existingPin) {
      const { error } = await supabase.from('pins').delete().eq('id', existingPin.id);
      if (!error) {
        setPins(prev => prev.filter(p => p.id !== existingPin.id));
        return { success: true };
      }
      return { success: false, error: error.message };
    } else {
      const canPin = await canPinMore();
      if (!canPin) return { success: false, error: 'Pin limit reached' };

      const { data, error } = await supabase
        .from('pins')
        .insert([{ user_id: user.id, post_id: postId }])
        .select()
        .single();

      if (!error && data) {
        setPins(prev => [data, ...prev]);
        return { success: true };
      }
      return { success: false, error: error?.message };
    }
  };

  return { pins, loading, togglePin, fetchPins };
}

export type { Pin, Post };
