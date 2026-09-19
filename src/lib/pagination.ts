// Offset-pagination params for admin list endpoints (`?page=&pageSize=`).
// Kept free of React so server components and route handlers can import it —
// the client-side counterparts live in components/admin/ui.
export const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

export function parsePageParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "", 10) || DEFAULT_PAGE_SIZE),
  );
  return { page, pageSize };
}
