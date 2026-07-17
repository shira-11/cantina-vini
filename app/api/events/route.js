import { syncEventEmitter } from '@/lib/eventEmitter';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const stream = new ReadableStream({
    start(controller) {
      const listener = () => {
        controller.enqueue(`data: update\n\n`);
      };

      // Send initial connection message to keep it alive
      controller.enqueue(`data: connected\n\n`);

      syncEventEmitter.on('db_update', listener);

      request.signal.addEventListener('abort', () => {
        syncEventEmitter.off('db_update', listener);
        try {
          controller.close();
        } catch (e) {
          // ignore error if already closed
        }
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
