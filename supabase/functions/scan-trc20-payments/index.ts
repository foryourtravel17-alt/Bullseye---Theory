Deno.serve((_req: Request) => {
  return new Response(JSON.stringify({
    error: "Online payments are disabled for Bullseye Theory.",
    message: "The website only displays product prices. Contact the administrator for manual enrolment."
  }), {
    status: 410,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "https://bullseye-theory.foryourtravel17.workers.dev",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Vary": "Origin"
    }
  });
});
