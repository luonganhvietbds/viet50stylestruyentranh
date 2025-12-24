
export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  return new Response(JSON.stringify({ 
    error: 'Endpoint Disabled', 
    message: 'Server-side AI generation is disabled. This application uses Client-side BYOK (Bring Your Own Key) architecture.' 
  }), {
    status: 404, // Not Found
    headers: { 'Content-Type': 'application/json' },
  });
}
