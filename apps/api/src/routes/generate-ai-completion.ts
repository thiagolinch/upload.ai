import { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../lib/firebase";
import { genAI } from "../lib/gemini";

export async function generateAiCompletionRoute(app: FastifyInstance) {
  app.post('/ai/complete', async (req, reply) => {
    const bodySchema = z.object({
      videoId: z.string().uuid(),
      template: z.string().optional(),
      prompt: z.string().optional(),
      temperature: z.number().min(0).max(1).default(0.5),
    })

    const { videoId, template, prompt, temperature } = bodySchema.parse(req.body)
    const rawPrompt = template || prompt

    if (!rawPrompt) {
      return reply.status(400).send({ error: 'O prompt ou template é obrigatório.' })
    }

    const videoDoc = await db.collection("videos").doc(videoId).get();

    if (!videoDoc.exists) {
      return reply.status(404).send({ error: 'Vídeo não encontrado.' })
    }

    const video = videoDoc.data()

    if (!video || !video.transcription) {
      return reply.status(400).send({ error: 'A transcrição do vídeo ainda não foi gerada.' })
    }

    const promptMessage = rawPrompt.replace('{transcription}', video.transcription)

    try {
      console.log("Iniciando streaming de completion com Gemini...");
      
      // Configurar cabeçalhos para streaming de texto puro compatível com useCompletion do frontend (incluindo cabeçalhos de CORS)
      reply.raw.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      });

      let modelName = 'gemini-2.5-flash';
      let model = genAI.getGenerativeModel({ model: modelName });
      let resultStream;

      try {
        resultStream = await model.generateContentStream({
          contents: [{ role: 'user', parts: [{ text: promptMessage }] }],
          generationConfig: {
            temperature,
          }
        });
      } catch (err: any) {
        console.warn(`Erro com ${modelName}, tentando fallback para gemini-3.5-flash:`, err.message);
        modelName = 'gemini-3.5-flash';
        model = genAI.getGenerativeModel({ model: modelName });
        resultStream = await model.generateContentStream({
          contents: [{ role: 'user', parts: [{ text: promptMessage }] }],
          generationConfig: {
            temperature,
          }
        });
      }

      for await (const chunk of resultStream.stream) {
        const text = chunk.text();
        reply.raw.write(text);
      }

      console.log("Streaming finalizado.");
      reply.raw.end();
    } catch (error) {
      console.error("Erro no streaming do Gemini:", error);
      if (!reply.raw.headersSent) {
        return reply.status(500).send({ error: 'Falha ao gerar conclusão com IA.' });
      } else {
        reply.raw.end();
      }
    }
  })
}