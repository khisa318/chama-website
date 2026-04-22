import { useEffect, useCallback, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase';

type TableName =
  | 'contributions'
  | 'loans'
  | 'welfare_claims'
  | 'notifications'
  | 'chat_messages'
  | 'groups'
  | 'group_members'
  | 'events'
  | 'event_rsvps';

type RealtimeEvent = {
  table: TableName;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  filter?: string; // e.g., 'user_id=eq.123'
};

/**
 * Hook for subscribing to Supabase Realtime events
 *
 * @example
 * useRealtimeChannel([
 *   {
 *     table: 'notifications',
 *     filter: `user_id=eq.${userId}`,
 *     onInsert: (payload) => {
 *       showToast('New notification!');
 *     }
 *   }
 * ]);
 */
export function useRealtimeChannel(events: RealtimeEvent[]) {
  const channelsRef = useRef<RealtimeChannel[]>([]);
  const supabase = getSupabaseClient();

  useEffect(() => {
    const channels = events.map((event) => {
      const channelName = `realtime-${event.table}-${Date.now()}`;

      let channel = supabase.channel(channelName);

      // Build the filter for PostgreSQL changes
      if (event.filter) {
        const [column, op, value] = event.filter.split('.');
        channel = channel.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: event.table,
            filter: `${column}=${op}.${value}`,
          },
          (payload) => {
            switch (payload.eventType) {
              case 'INSERT':
                event.onInsert?.(payload);
                break;
              case 'UPDATE':
                event.onUpdate?.(payload);
                break;
              case 'DELETE':
                event.onDelete?.(payload);
                break;
            }
          }
        );
      } else {
        channel = channel.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: event.table,
          },
          (payload) => {
            switch (payload.eventType) {
              case 'INSERT':
                event.onInsert?.(payload);
                break;
              case 'UPDATE':
                event.onUpdate?.(payload);
                break;
              case 'DELETE':
                event.onDelete?.(payload);
                break;
            }
          }
        );
      }

      channel.subscribe();
      return channel;
    });

    channelsRef.current = channels;

    return () => {
      channelsRef.current.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    };
  }, [events, supabase]);

  const unsubscribe = useCallback(() => {
    channelsRef.current.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    channelsRef.current = [];
  }, [supabase]);

  return { unsubscribe };
}

/**
 * Hook specifically for real-time notifications
 */
export function useRealtimeNotifications(userId: string, onNewNotification?: (notification: any) => void) {
  const supabase = getSupabaseClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          onNewNotification?.(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // Notification was marked as read
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, onNewNotification, supabase]);
}

/**
 * Hook for real-time chat messages
 */
export function useRealtimeChat(groupId: string, onNewMessage?: (message: any) => void) {
  const supabase = getSupabaseClient();

  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`chat-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          onNewMessage?.(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, onNewMessage, supabase]);
}

/**
 * Hook for real-time group updates (contributions, loans, etc.)
 */
export function useRealtimeGroupUpdates(
  groupId: string,
  callbacks: {
    onNewContribution?: (contribution: any) => void;
    onNewLoan?: (loan: any) => void;
    onLoanUpdate?: (loan: any) => void;
    onNewWelfareClaim?: (claim: any) => void;
    onWelfareClaimUpdate?: (claim: any) => void;
    onMemberJoined?: (member: any) => void;
    onNewEvent?: (event: any) => void;
  }
) {
  const supabase = getSupabaseClient();

  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`group-updates-${groupId}`)

      // Contributions
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contributions',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          callbacks.onNewContribution?.(payload.new);
        }
      )

      // Loans
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loans',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            callbacks.onNewLoan?.(payload.new);
          } else if (payload.eventType === 'UPDATE') {
            callbacks.onLoanUpdate?.(payload.new);
          }
        }
      )

      // Welfare Claims
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'welfare_claims',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            callbacks.onNewWelfareClaim?.(payload.new);
          } else if (payload.eventType === 'UPDATE') {
            callbacks.onWelfareClaimUpdate?.(payload.new);
          }
        }
      )

      // New member joined
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_members',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          callbacks.onMemberJoined?.(payload.new);
        }
      )

      // New event created
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'events',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          callbacks.onNewEvent?.(payload.new);
        }
      )

      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, supabase, callbacks]);
}
