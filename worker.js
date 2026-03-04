export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;

    // Set CORS headers for React app to communicate
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Endpoint to load room state
    if (request.method === 'GET' && pathname.startsWith('/api/room/')) {
      const roomId = pathname.split('/').pop();

      try {
        // Attempt fast retrieval from Cloudflare KV
        if (env.KV) {
          const cachedRoom = await env.KV.get(`room:${roomId}`, 'json');
          if (cachedRoom) {
            return new Response(JSON.stringify(cachedRoom), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }

        const { results } = await env.DB.prepare(
          'SELECT id, type, x, y FROM RoomState WHERE room_id = ?'
        ).bind(roomId).all();

        // Save to KV for next time
        if (env.KV && results.length > 0) {
          await env.KV.put(`room:${roomId}`, JSON.stringify(results), { expirationTtl: 300 }); // Cache for 5 mins
        }

        return new Response(JSON.stringify(results), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Endpoint to save item/character state
    if (request.method === 'POST' && pathname === '/api/save') {
      try {
        const data = await request.json();
        const { id, roomId, type, x, y } = data;

        if (!id || !roomId || !type || x === undefined || y === undefined) {
          return new Response('Missing required fields', { status: 400, headers: corsHeaders });
        }

        // Insert or Update the state
        await env.DB.prepare(
          `INSERT INTO RoomState (id, room_id, type, x, y)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET x=excluded.x, y=excluded.y, updated_at=CURRENT_TIMESTAMP`
        ).bind(id, roomId, type, x, y).run();

        // Invalidate the cache for this room when it changes
        if (env.KV) {
          await env.KV.delete(`room:${roomId}`);
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  },
};
