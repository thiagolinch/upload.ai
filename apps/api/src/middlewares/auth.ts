import { FastifyRequest, FastifyReply } from 'fastify';
import admin from '../lib/firebase';

export async function verifyFirebaseToken(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Attach the decoded token to the request so routes can use the user info
    (request as any).user = decodedToken;
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    return reply.status(401).send({ error: 'Unauthorized: Invalid token' });
  }
}
