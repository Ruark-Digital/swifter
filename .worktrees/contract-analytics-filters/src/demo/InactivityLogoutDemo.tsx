import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useInactivityLogout } from '@/hooks/useInactivityLogout';
import { useAuthentication } from '@/hooks/useAuthentication';

/**
 * Demo component to test the inactivity logout functionality
 * This component shows the current status and allows manual testing
 */
export const InactivityLogoutDemo: React.FC = () => {
  const [lastActivity, setLastActivity] = useState<Date>(new Date());
  const [timeRemaining, setTimeRemaining] = useState<number>(30 * 60); // 30 minutes in seconds
  const isAuthenticated = useAuthentication();
  
  // Use the hook with a shorter timeout for demo purposes (5 minutes)
  const { resetTimer } = useInactivityLogout(5 * 60 * 1000); // 5 minutes for demo

  // Update last activity time when user interacts
  useEffect(() => {
    const updateActivity = () => {
      setLastActivity(new Date());
      setTimeRemaining(5 * 60); // Reset to 5 minutes for demo
    };

    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll', 'click'];
    events.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
    };
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          return 5 * 60; // Reset when it reaches 0
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleManualReset = () => {
    resetTimer();
    setLastActivity(new Date());
    setTimeRemaining(5 * 60);
  };

  if (!isAuthenticated) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Inactivity Logout Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Please log in to test the inactivity logout feature.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Inactivity Logout Demo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium">Authentication Status:</p>
          <p className="text-sm text-green-600">✓ Authenticated</p>
        </div>
        
        <div>
          <p className="text-sm font-medium">Last Activity:</p>
          <p className="text-sm text-muted-foreground">{lastActivity.toLocaleTimeString()}</p>
        </div>
        
        <div>
          <p className="text-sm font-medium">Time Until Logout (Demo - 5 min):</p>
          <p className="text-lg font-mono text-red-600">{formatTime(timeRemaining)}</p>
        </div>
        
        <div className="text-xs text-muted-foreground">
          <p>• Production timeout: 30 minutes</p>
          <p>• Demo timeout: 5 minutes</p>
          <p>• Move mouse or click to reset timer</p>
        </div>
        
        <Button onClick={handleManualReset} className="w-full">
          Reset Timer Manually
        </Button>
      </CardContent>
    </Card>
  );
};

export default InactivityLogoutDemo;