import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ErrorFallback } from "./components/layouts/Error";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Toaster } from "./components/ui/toaster";
import Loading from "@/components/ui/Spinner";
import AIChatWidget from "./components/layouts/AIChatWidget";
import { useAuthentication } from "@/hooks/useAuthentication";
import { useToken, useUser } from "@/store/authSlice";
import { config } from "@/config";

// Chat (MCP) origin tracks the active API environment (bug/staging/prod).
const MCP_BASE_URL = config.chatBaseUrl;

// All users share a single chat endpoint.
const CHAT_URL = `${MCP_BASE_URL}/chat/`;

import * as Sentry from "@sentry/react";
import { routes } from "./routes";
import { Suspense } from "react";

// Per-env Sentry knobs. Prod is conservative (cost + PII), bug is verbose
// (that's the whole point of the env), staging sits in the middle, dev
// mirrors bug so local repro matches what QA sees.
const SENTRY_ENV_CONFIG: Record<
  typeof config.env,
  {
    dsn: string | undefined;
    tracesSampleRate: number;
    replaysSessionSampleRate: number;
    replaysOnErrorSampleRate: number;
  }
> = {
  prod: {
    dsn: import.meta.env.VITE_SENTRY_DSN_PROD ?? import.meta.env.VITE_SENTRY_DSN,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,
  },
  staging: {
    dsn: import.meta.env.VITE_SENTRY_DSN_STAGING ?? import.meta.env.VITE_SENTRY_DSN,
    tracesSampleRate: 0.5,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  },
  bug: {
    dsn: import.meta.env.VITE_SENTRY_DSN_BUG ?? import.meta.env.VITE_SENTRY_DSN,
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.5,
    replaysOnErrorSampleRate: 1.0,
  },
  dev: {
    dsn: import.meta.env.VITE_SENTRY_DSN,
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  },
};

const sentrySettings = SENTRY_ENV_CONFIG[config.env];

if (sentrySettings.dsn) {
  Sentry.init({
    dsn: sentrySettings.dsn,
    environment: config.env,
    release: import.meta.env.VITE_SENTRY_RELEASE,
    sendDefaultPii: true,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: sentrySettings.tracesSampleRate,
    tracePropagationTargets: [
      "localhost",
      /^https:\/\/api\.swiftpro\.tech\/api/,
      /^https:\/\/dev\.swiftpro\.tech\/api/,
      /^https:\/\/bug-api\.swiftpro\.tech\/api/,
    ],
    replaysSessionSampleRate: sentrySettings.replaysSessionSampleRate,
    replaysOnErrorSampleRate: sentrySettings.replaysOnErrorSampleRate,
  });
}

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
  const token = useToken();
  const user = useUser();
  const chatWelcomeMessage = user?.name
    ? `Hi ${user.name}, I'm the SwiftPro Assistant. Ask me about your contracts, solicitations, or evaluations.`
    : "Hi, I'm the SwiftPro Assistant. Ask me about your contracts, solicitations, or evaluations.";

  const postChat = async (message: string, stream: boolean) => {
    const response = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream, application/json',
      },
      body: JSON.stringify({
        userToken: token,
        stream,
        messages: [{ role: 'user', content: message }],
      }),
    });

    if (!response.ok) {
      let errMsg = 'Unknown error';
      try {
        const errData = await response.json();
        errMsg = errData.error || errData.message || errMsg;
      } catch { void 0; }
      throw new Error(`API Error: ${response.status} - ${errMsg}`);
    }
    return response;
  };

  // Parse the MCP integration server's named-event SSE stream.
  const parseMcpStream = async (
    response: Response,
    onContent: (text: string) => void,
    onTool?: (phase: 'start' | 'end', tool: string) => void
  ) => {
    const reader = response.body?.getReader();
    if (!reader) {
      const data = await response.json();
      const direct = data?.choices?.[0]?.message?.content ?? '';
      if (direct) onContent(direct);
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let currentEvent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (line.startsWith('event:')) {
          currentEvent = line.slice(6).trim();
          continue;
        }
        if (!line.startsWith('data:')) continue;
        const raw = line.slice(5).trim();
        if (!raw || raw === '[DONE]') continue;
        let p: any;
        try { p = JSON.parse(raw); } catch { continue; }

        switch (currentEvent) {
          case 'content':
            if (typeof p.content === 'string') onContent(p.content);
            break;
          case 'tool_start':
          case 'tool_cached':
            if (p.tool) onTool?.('start', p.tool);
            break;
          case 'tool_result':
          case 'tool_error':
            if (p.tool) onTool?.('end', p.tool);
            break;
        }
      }
    }
  };

  const handleAIChatMessage = async (message: string): Promise<string> => {
    try {
      const response = await postChat(message, false);
      const data = await response.json();
      return data?.choices?.[0]?.message?.content || 'No response received from AI';
    } catch (error) {
      console.error('AI Chat Error:', error);
      throw new Error('Failed to get AI response');
    }
  };

  const handleAIChatMessageStream = async (
    message: string,
    onDelta: (partial: string) => void,
    onTool?: (phase: 'start' | 'end', tool: string) => void
  ): Promise<void> => {
    try {
      const response = await postChat(message, true);
      await parseMcpStream(response, onDelta, onTool);
    } catch (error) {
      console.error('AI Chat Stream Error:', error);
      throw new Error('Failed to stream AI response');
    }
  };

  const handleAIChatReset = async (): Promise<void> => {
    await fetch(`${MCP_BASE_URL}/chat/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userToken: token }),
    });
  };

  return (
    <HelmetProvider>
      <ThemeProvider defaultTheme="system" storageKey="swiftpro-theme">
        <Sentry.ErrorBoundary fallback={({ error }) => <ErrorFallback error={error} />}>
          <QueryClientProvider client={queryClient}>
            <Suspense fallback={<RenderLoader />}>
              <RouterProvider router={router} />
            </Suspense>
            {Boolean(user?.isAi) && isAuthenticated && (
              <AIChatWidget
                onSendMessage={handleAIChatMessage}
                onStreamMessage={handleAIChatMessageStream}
                onReset={handleAIChatReset}
                welcomeMessage={chatWelcomeMessage}
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
