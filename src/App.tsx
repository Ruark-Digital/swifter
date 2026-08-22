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
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/components/ui/use-toast";
import { downloadBase64File } from "@/lib/utils";
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

// Renders the assistant with a role-scoped greeting. Kept as its own component
// so it can read the active role via useUserRole (which fetches the role
// catalog through react-query) from inside the QueryClientProvider.
const AssistantWidget: React.FC<{
  onSendMessage: (message: string) => Promise<string>;
  onStreamMessage: (
    message: string,
    onDelta: (partial: string) => void,
    onTool?: (phase: "start" | "end", tool: string) => void,
  ) => Promise<void>;
  onReset: () => Promise<void>;
}> = (props) => {
  const user = useUser();
  const { isVendor, isProjectManager } = useUserRole();
  // Vendors and PMs have no access to evaluations, so omit that scope from the
  // assistant's greeting for those roles.
  const chatScope =
    isVendor || isProjectManager
      ? "contracts and solicitations"
      : "contracts, solicitations, or evaluations";
  const welcomeMessage = user?.name
    ? `Hi ${user.name}, I'm your SwiftPro Assistant. Ask me about your ${chatScope}.`
    : `Hi, I'm your SwiftPro Assistant. Ask me about your ${chatScope}.`;

  return <AIChatWidget {...props} welcomeMessage={welcomeMessage} />;
};

function App() {
  const isAuthenticated = useAuthentication();
  const token = useToken();
  const user = useUser();
  const { toast } = useToast();

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
    onTool?: (phase: 'start' | 'end', tool: string) => void,
    onDocument?: (doc: {
      filename: string;
      contentType: string;
      contentBase64: string;
      size: number;
    }) => void
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
          case 'document_ready':
            // Binary export (PDF/DOCX) arrives inline as base64, ahead of the
            // AI's text reply. Hand the whole payload to the caller to decode
            // and deliver — the parser itself stays side-effect free.
            if (typeof p.contentBase64 === 'string' && p.filename) {
              onDocument?.({
                filename: p.filename,
                contentType: p.contentType,
                contentBase64: p.contentBase64,
                size: p.size,
              });
            }
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
      await parseMcpStream(response, onDelta, onTool, (doc) => {
        try {
          downloadBase64File(doc.contentBase64, doc.filename, doc.contentType);
          const sizeKb = Math.max(1, Math.round((doc.size || 0) / 1024));
          toast({
            title: 'Document ready',
            description: `${doc.filename} (${sizeKb} KB) is downloading…`,
          });
        } catch (decodeError) {
          console.error('Document download failed:', decodeError);
          toast({
            title: 'Document generation failed',
            description: 'Please try again.',
            variant: 'destructive',
          });
        }
      });
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
              <AssistantWidget
                onSendMessage={handleAIChatMessage}
                onStreamMessage={handleAIChatMessageStream}
                onReset={handleAIChatReset}
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
