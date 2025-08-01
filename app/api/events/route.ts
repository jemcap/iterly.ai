import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Store active connections
const connections = new Map<string, ReadableStreamDefaultController>();

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = (session as any).user.id;
  console.log('📡 EventStream - New connection for user:', userId);
  
  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      // Store the connection for this user
      connections.set(userId, controller);
      console.log('📡 EventStream - Connection stored, total connections:', connections.size);
      
      // Send initial connection message
      controller.enqueue(`data: ${JSON.stringify({ type: 'connected', userId })}\n\n`);
      console.log('📡 EventStream - Sent connection confirmation to user:', userId);
      
      // Keep connection alive with heartbeat
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`);
        } catch (error) {
          console.log('📡 EventStream - Heartbeat failed, cleaning up connection for user:', userId);
          clearInterval(heartbeat);
          connections.delete(userId);
        }
      }, 30000); // Every 30 seconds
      
      // Clean up on connection close
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        connections.delete(userId);
        try {
          controller.close();
        } catch (error) {
          // Connection already closed
        }
      });
    },
    cancel() {
      connections.delete(userId);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}

// Function to broadcast events to specific user
export function broadcastToUser(userId: string, event: any) {
  console.log('📡 EventStream - Broadcasting to user:', userId, 'Event:', event.type);
  console.log('📡 EventStream - Available connections:', Array.from(connections.keys()));
  
  const connection = connections.get(userId);
  if (connection) {
    try {
      const message = `data: ${JSON.stringify(event)}\n\n`;
      connection.enqueue(message);
      console.log('📡 EventStream - Successfully broadcast event:', event.type);
      return true;
    } catch (error) {
      console.error('📡 EventStream - Error broadcasting to user:', userId, error);
      connections.delete(userId);
      return false;
    }
  } else {
    console.log('📡 EventStream - No connection found for user:', userId);
    return false;
  }
}

// Function to broadcast to all connections
export function broadcastToAll(event: any) {
  connections.forEach((connection, userId) => {
    try {
      connection.enqueue(`data: ${JSON.stringify(event)}\n\n`);
    } catch (error) {
      console.error(`Error broadcasting to user ${userId}:`, error);
      connections.delete(userId);
    }
  });
}