import { Fragment, Suspense } from "react";
import { routes } from "@/routes";
import * as Sentry from "@sentry/react";
import Loading from "@/components/ui/Spinner";
import { Toaster } from "./components/ui/toaster";
import { getProvider } from "./hooks/useProviders";
import { ErrorFallback } from "./components/layouts/Error";
import { QueryClient, QueryClientProvider as QueryClientP } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const RenderLoader = () => {
  return (
    <div className="flex flex-auto items-center justify-center flex-col min-h-[100vh]">
      <Loading />
    </div>
  );
};

// Create router with proper configuration
const router = createBrowserRouter(routes);

export const RouterProviderObject = getProvider({
  provider: RouterProvider,
  props: {
    router,
  },
});

console.log(routes, RouterProviderObject);

export const QueryClientProvider = getProvider({
  provider: QueryClientP,
  props: {
    client: new QueryClient()
  },
  children: [RouterProviderObject],
});

export const SuspenseFallback = getProvider({
  provider: Suspense,
  props: {
    fallback: <RenderLoader />,
  },
  children: [QueryClientProvider],
});

export const ToasterProvider = getProvider({
  provider: Toaster,
});

export const SentryErrorBoundary = getProvider({
  provider: Sentry.ErrorBoundary,
  props: {
    fallback: ({ error }) => <ErrorFallback error={error} />,
  },
  children: [SuspenseFallback, ToasterProvider],
});

export const providers = getProvider({
  provider: Fragment,
  children: [QueryClientProvider]
})