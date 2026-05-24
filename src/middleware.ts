import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static, _next/image (assets)
     * - _next/data, _rsc (React Server Components payload)
     * - favicon, robots, sitemap
     * - api/* (rotas de API têm sua própria auth quando necessário)
     * - arquivos com extensão (svg, png, jpg, css, js, woff, etc.)
     */
    "/((?!_next/static|_next/image|_next/data|favicon.ico|robots.txt|sitemap.xml|api/|.*\\.[\\w]+$).*)",
  ],
};
