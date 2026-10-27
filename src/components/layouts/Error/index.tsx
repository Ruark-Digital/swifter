// import { getEnvironment } from "@/lib/utils";
// import NotFoundSVG from "../../assets/404.gif";
import { isRouteErrorResponse, useRouteError } from "react-router-dom";

type ErrorFallbackProps = {
  error?: any;
};

function ErrorFallbackUI({ error }: { error: unknown }) {
  if (!error) {
    return (
      <div className="container mx-auto h-screen grid xl:grid-cols-2 gap-8 justify-center">
        <span>Unknown error occurred</span>
      </div>
    );
  }

  const isRouteError = isRouteErrorResponse(error);
  const message = isRouteError
    ? ((error as any).statusText || (error as any).data?.message)
    : ((error as any)?.message || "An unexpected error occurred");

  return (
    <div className="container mx-auto h-screen grid xl:grid-cols-2 gap-8 justify-center">
      <div className="flex items-center">
        {/* <img className="w-full h-60" src={NotFoundSVG} alt="" /> */}
      </div>
      <div className="flex flex-col items-center xl:items-start xl:justify-center xl:text-left text-center">
        <h1 className="text-5xl font-bold text-gray-800 mb-8">
          Oops,
          <br />
          <span className="text-primary">Something went wrong</span> here...
        </h1>
        <p className="text-xl text-gray-700 mb-8">
          Oh no, there's an issue with the app.
          {/* {getEnvironment("DEVELOPMENT") && <pre>{error.message}</pre>} */}
          <i className="text-red-400 px-3">{message}</i>
        </p>
        <a
          href="/"
          className="px-4 py-2 rounded-lg underline text-primary underline-offset-2"
        >
          Home
        </a>
      </div>
    </div>
  );
}

// For use inside react-router-dom data-router `errorElement` slots — pulls the
// thrown error from router context via the hook.
export function RouteErrorFallback() {
  const error = useRouteError();
  return <ErrorFallbackUI error={error} />;
}

// For use inside non-router error boundaries (Sentry.ErrorBoundary, etc.) where
// the caller passes the error directly as a prop.
export function ErrorFallback(props: ErrorFallbackProps) {
  return <ErrorFallbackUI error={props.error} />;
}
