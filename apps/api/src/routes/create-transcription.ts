import 'dotenv/config';
import fs from 'node:fs';
import { FastifyInstance } from "fastify";
import { z } from "zod"
import { db } from "../lib/firebase";
import { genAI } from "../lib/gemini";
import { verifyFirebaseToken } from "../middlewares/auth";

export async function createTranscriptionRoute(app: FastifyInstance) {
    app.post("/videos/:videoId/transcription", { preHandler: [verifyFirebaseToken] }, async (req, res) => {
        const paramsSchema = z.object({
            videoId: z.string().uuid(),
        })

        const { videoId } = paramsSchema.parse(req.params)

        const bodySchema = z.object({
            prompt: z.string().optional().default('')
        })

        const { prompt } = bodySchema.parse(req.body)
        console.log("Palavras-chave recebidas:", prompt)

        const videoDoc = await db.collection("videos").doc(videoId).get();

        if (!videoDoc.exists) {
            return res.status(404).send({ error: "Vídeo não encontrado no banco de dados." })
        }

        const video = videoDoc.data()
        const videoPath = video?.path

        if (!videoPath || !fs.existsSync(videoPath)) {
            return res.status(400).send({ error: "Arquivo de áudio correspondente não encontrado no servidor." })
        }

        try {
            console.log("Lendo arquivo de áudio...", videoPath);
            const audioData = fs.readFileSync(videoPath);
            const audioPart = {
                inlineData: {
                    data: audioData.toString("base64"),
                    mimeType: 'audio/mp3'
                }
            };

            const transcriptionInstructions =
                `Transcreva o áudio a seguir com extrema precisão, respeitando a pontuação natural. ` +
                `Retorne APENAS a transcrição literal de tudo o que for dito no áudio, sem introduções, notas do tradutor, markdown ou comentários adicionais. ` +
                (prompt ? `Dica de termos/palavras-chave mencionadas que podem ajudar na transcrição: ${prompt}` : "");

            let modelName = "gemini-2.5-flash";
            let model = genAI.getGenerativeModel({ model: modelName });
            let result;

            try {
                console.log(`Enviando áudio para o ${modelName} para transcrição...`);
                result = await model.generateContent([audioPart, transcriptionInstructions]);
            } catch (err: any) {
                console.warn(`Erro com ${modelName}, tentando fallback para gemini-3.5-flash:`, err.message);
                modelName = "gemini-3.5-flash";
                model = genAI.getGenerativeModel({ model: modelName });
                console.log(`Enviando áudio para o ${modelName} para transcrição...`);
                result = await model.generateContent([audioPart, transcriptionInstructions]);
            }

            const response = result.response;
            const transcription = response.text();

            console.log("Transcrição obtida com sucesso!");

            await db.collection("videos").doc(videoId).update({
                transcription
            });

            return transcription;
        } catch (error) {
            console.error("Erro ao transcrever com Gemini:", error);
            return res.status(500).send({ error: "Falha ao transcrever o áudio utilizando o Gemini." });
        }
    })
} 