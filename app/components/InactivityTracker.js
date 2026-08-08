'use client';

import { useEffect, useRef } from 'react';

export default function InactivityTracker() {
  const timeoutRef = useRef(null);
  const userSettingsRef = useRef({ enabled: false, minutes: 30 });

  useEffect(() => {
    let isMounted = true;

    const checkUserSettings = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user && isMounted) {
            userSettingsRef.current = {
              enabled: data.user.autoLogoutEnabled !== false,
              minutes: data.user.autoLogoutMinutes || 30
            };
            resetTimer();
          }
        }
      } catch (err) {
        console.error('Error checking user settings for inactivity tracker:', err);
      }
    };

    const handleAutoLogout = async () => {
      try {
        await fetch('/api/auth/logout?reason=auto_timeout', { method: 'POST' });
      } catch (e) {
        console.error(e);
      } finally {
        window.location.href = '/login?reason=timeout';
      }
    };

    const resetTimer = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (userSettingsRef.current.enabled && userSettingsRef.current.minutes > 0) {
        const ms = userSettingsRef.current.minutes * 60 * 1000;
        timeoutRef.current = setTimeout(() => {
          handleAutoLogout();
        }, ms);
      }
    };

    const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];
    const handleActivity = () => {
      resetTimer();
    };

    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    checkUserSettings();

    return () => {
      isMounted = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, []);

  return null;
}
