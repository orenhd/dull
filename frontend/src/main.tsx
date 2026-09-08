import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import "@/i18n"; // side-effect: מאתחל את i18next לפני שהעץ מצטייר
import { router } from "@/router";
import "@/styles/index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // קטלוג מוצרים לא משתנה כל שנייה - נמנעים מ-refetch מיותר על כל
      // focus/reconnect. אפשר להדק (staleTime נמוך יותר) כשיהיה CMS חי.
      staleTime: 60_000,
      retry: 1,
    },
  },
});

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("#root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
