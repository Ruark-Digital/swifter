import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ErrorFallback } from "./components/layouts/Error";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Toaster } from "./components/ui/toaster";
import Loading from "@/components/ui/Spinner";
import AIChatWidget from "./components/layouts/AIChatWidget";
import { useAuthentication } from "@/hooks/useAuthentication";
import { useUserRole } from "@/hooks/useUserRole";
import { useToken, useUser } from "@/store/authSlice";

import * as Sentry from "@sentry/react";
import { routes } from "./routes";
import { Suspense } from "react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
  // Enable logs to be sent to Sentry
  // enableLogs: true,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration()
  ],
  // Tracing
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
  // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: ["localhost", /^https:\/\/api\.swiftpro\.tech\/api/],
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0 // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.,
});

const RenderLoader = () => {
  return (
    <div className="flex flex-auto items-center justify-center flex-col min-h-[100vh]">
      <Loading />
    </div>
  );
};

// Create router with proper configuration
const router = createBrowserRouter(routes);
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
    },
  },
});

function App() {
  const isAuthenticated = useAuthentication();
  const { isVendor } = useUserRole();
  const token = useToken();
  const user = useUser();
  
  // Custom function to handle AI chat messages
  const handleAIChatMessage = async (message: string): Promise<string> => {
    try {
      const response = await fetch('https://dev.swiftpro.tech/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream, application/json'
        },
        body: JSON.stringify({
          userToken: token,
          stream: true,
          //  "model": "mistralai/mistral-7b-instruct:free",
          messages: [
            {
              role: 'user',
              content: message
            }
          ]
        })
      });

      if (!response.ok) {
        let errMsg = 'Unknown error';
        try {
          const errData = await response.json();
          errMsg = errData.message || errData.error || errMsg;
        } catch {
          void 0;
        }
        throw new Error(`API Error: ${response.status} - ${errMsg}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        const data = await response.json();
        const direct =
          (data?.choices && data.choices[0]?.message?.content) ||
          data?.response ||
          data?.content ||
          data?.message;
        return direct || 'No response received from AI';
      }

      const contentType = response.headers.get('content-type') || '';
      const decoder = new TextDecoder();
      let buffer = '';
      let finalText = '';
      let doneReceived = false;

      while (!doneReceived) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        if (contentType.includes('text/event-stream')) {
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.startsWith('data:')) continue;
            const dataStr = line.slice(5).trim();
            if (dataStr === '[DONE]') { buffer = ''; doneReceived = true; break; }
            // Only append actual content tokens; ignore info/metadata
            if (dataStr.startsWith('{') || dataStr.startsWith('[')) {
              try {
                const obj = JSON.parse(dataStr);
                const delta =
                  obj?.choices?.[0]?.delta?.content ??
                  obj?.content ??
                  obj?.message ??
                  obj?.response ??
                  '';
                if (typeof delta === 'string' && delta) finalText += delta;
              } catch {
                // ignore malformed partial JSON
              }
            }
          }
        } else {
          finalText += chunk;
          buffer = '';
        }
      }

      finalText = finalText.trim();
      return finalText || 'No response received from AI';
    } catch (error) {
      console.error('AI Chat Error:', error);
      throw new Error('Failed to get AI response');
    }
  };

  // Streaming variant that emits deltas to a callback for live UI updates
  const handleAIChatMessageStream = async (
    message: string,
    onDelta: (partial: string) => void
  ): Promise<void> => {
    try {
      const response = await fetch('https://dev.swiftpro.tech/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream, application/json'
        },
        body: JSON.stringify({
          userToken: token,
          stream: true,
          messages: [
            { role: 'user', content: message }
          ]
        })
      });

      if (!response.ok) {
        let errMsg = 'Unknown error';
        try {
          const errData = await response.json();
          errMsg = errData.message || errData.error || errMsg;
        } catch {
          void 0;
        }
        throw new Error(`API Error: ${response.status} - ${errMsg}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        const data = await response.json();
        const direct =
          (data?.choices && data.choices[0]?.message?.content) ||
          data?.response ||
          data?.content ||
          data?.message || '';
        if (direct) onDelta(direct);
        return;
      }

      const contentType = response.headers.get('content-type') || '';
      const decoder = new TextDecoder();
      let buffer = '';
      let doneReceived = false;

      while (!doneReceived) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        if (contentType.includes('text/event-stream')) {
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.startsWith('data:')) continue;
            const dataStr = line.slice(5).trim();
            if (dataStr === '[DONE]') { buffer = ''; doneReceived = true; break; }
            // Only emit actual content tokens; ignore info/metadata
            if (dataStr.startsWith('{') || dataStr.startsWith('[')) {
              try {
                const obj = JSON.parse(dataStr);
                const delta =
                  obj?.choices?.[0]?.delta?.content ??
                  obj?.content ??
                  obj?.message ??
                  obj?.response ??
                  '';
                if (typeof delta === 'string' && delta) onDelta(delta);
              } catch {
                // ignore malformed partial JSON
              }
            }
          }
        } else {
          if (chunk) onDelta(chunk);
          buffer = '';
        }
      }
    } catch (error) {
      console.error('AI Chat Stream Error:', error);
      throw new Error('Failed to stream AI response');
    }
  };

  return (
    <HelmetProvider>
      <ThemeProvider defaultTheme="system" storageKey="swiftpro-theme">
        <Sentry.ErrorBoundary fallback={({ error }) => <ErrorFallback error={error} />}>
          <QueryClientProvider client={queryClient}>
            <Suspense fallback={<RenderLoader />}>
              <RouterProvider router={router} />
            </Suspense>
            {Boolean(user?.isAi) && isAuthenticated && !isVendor && (
              <AIChatWidget
                onSendMessage={handleAIChatMessage}
                onStreamMessage={handleAIChatMessageStream}
              />
            )}
          </QueryClientProvider>
          <Toaster />
        </Sentry.ErrorBoundary>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
