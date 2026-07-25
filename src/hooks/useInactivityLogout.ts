import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSetReset } from '@/store/authSlice';
import { useAuthentication } from '@/hooks/useAuthentication';

/**
 * Hook that automatically logs out the user after a specified period of inactivity
 * @param timeout - Timeout in milliseconds (default: 5 minutes = 300000ms)
 */
export function useInactivityLogout(timeout = 300000) {
  const navigate = useNavigate();
  const setReset = useSetReset();
  const isAuthenticated = useAuthentication();
  const timerRef = useRef<NodeJS.Timeout>();
  const isLocalDevelopment = import.meta.env.DEV;

  const resetTimer = useCallback(() => {
    if (isLocalDevelopment) {
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setReset();
      navigate('/');
    }, timeout);
  }, [isLocalDevelopment, navigate, setReset, timeout]);

  useEffect(() => {
    if (!isAuthenticated || isLocalDevelopment) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      return;
    }

    // Events that indicate user activity
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll', 'click'];

    // Add event listeners for all activity events
    events.forEach(event => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    // Set initial timer
    resetTimer();

    // Cleanup function
    return () => {
      // Remove all event listeners
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
      
      // Clear timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isAuthenticated, isLocalDevelopment, resetTimer]);

  // Return a function to manually reset the timer if needed
  return { resetTimer };
}
