import { FastifyInstance } from "fastify";
import { verifyFirebaseToken } from "../middlewares/auth";
import { fastifyMultipart } from "@fastify/multipart";
import * as cheerio from "cheerio";
import axios from "axios";
import { randomUUID } from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import { pipeline } from "node:stream/promises";
import { genAI } from "../lib/gemini";
import admin, { db } from "../lib/firebase";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";

export async function marketingAutomationRoute(app: FastifyInstance) {
    // Registra suporte a multipart/form-data (upload de arquivo) se não estiver registrado no server.ts
    if (!app.hasPlugin('@fastify/multipart')) {
        app.register(fastifyMultipart, {
            limits: {
                fileSize: 10 * 1024 * 1024 // 10MB limit
            }
        });
    }

    // Rota para servir os arquivos locais temporários (já que o Storage está dando erro 404 de bucket inexistente)
    app.get("/tmp/:filename", async (req: any, reply) => {
        const filename = req.params.filename;
        const filePath = path.resolve(__dirname, '../../tmp', filename);
        if (fs.existsSync(filePath)) {
            const stream = fs.createReadStream(filePath);
            return reply.type('image/png').send(stream);
        }
        return reply.status(404).send({ error: "File not found" });
    });

    app.post("/marketing/generate", { preHandler: [verifyFirebaseToken] }, async (req, reply) => {
        // Recebe os dados multipart
        const data = await req.file();
        
        if (!data) {
            return reply.status(400).send({ error: 'Missing image file.' });
        }

        const urlField = data.fields.url;
        const targetUrl = urlField && 'value' in urlField ? urlField.value : null;

        if (!targetUrl || typeof targetUrl !== 'string') {
            return reply.status(400).send({ error: 'Missing valid URL.' });
        }

        const userId = (req as any).user.uid;
        console.log(`[Marketing] Iniciando job para o usuário ${userId}`);
        console.log(`[Marketing] Lendo URL: ${targetUrl}`);

        try {
            // Fase 1: Web Scraping com Cheerio
            const response = await axios.get(targetUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            const $ = cheerio.load(response.data);
            
            // Extrai as tags principais
            const title = $('h1').first().text() || $('title').text();
            
            // Remove scripts, styles e SVGs do body para limpar o texto
            $('script, style, svg, nav, footer, header').remove();
            
            // Pega todo o texto dos parágrafos
            const paragraphs: string[] = [];
            $('p').each((_, el) => {
                const text = $(el).text().trim();
                if (text.length > 30) paragraphs.push(text);
            });
            
            const articleContent = paragraphs.slice(0, 10).join('\\n\\n'); // Pega os 10 primeiros parágrafos para não estourar tokens do LLM
            
            console.log(`[Marketing] Scraping concluído. Título: ${title}`);
            console.log(`[Marketing] Conteúdo lido: ${articleContent.substring(0, 100)}...`);

            // Salva a imagem temporariamente e garante que o diretório tmp exista
            const tmpDir = path.resolve(__dirname, '../../tmp');
            if (!fs.existsSync(tmpDir)) {
                fs.mkdirSync(tmpDir, { recursive: true });
            }

            const fileExtension = path.extname(data.filename) || '.jpg';
            const fileBaseName = path.basename(data.filename, fileExtension);
            const fileUploadName = `${fileBaseName}-${randomUUID()}${fileExtension}`;
            const uploadDestination = path.resolve(tmpDir, fileUploadName);
            
            await pipeline(data.file, fs.createWriteStream(uploadDestination));
            console.log(`[Marketing] Imagem salva em: ${uploadDestination}`);

            // Fase 2: Integração com Inteligência Artificial (Gemini)
            console.log(`[Marketing] Enviando texto para a IA...`);
            const prompt = `Você é um copywriter especialista em marketing digital e mídias sociais.
Baseado no seguinte texto extraído de um artigo de blog (título: ${title}):
"${articleContent}"

Sua tarefa é criar conteúdo para redes sociais extraindo os melhores insights do texto.
Gere um JSON estritamente válido com a seguinte estrutura, onde "quote" é uma frase de impacto incisiva inspirada no texto (ideal para colocar no centro de uma imagem de design), e "caption" é a legenda do post (com hashtags pertinentes). O "quote" deve ser curto (máximo 80 caracteres).

{
  "instagram": { "quote": "...", "caption": "..." },
  "facebook": { "quote": "...", "caption": "..." },
  "pinterest": { "quote": "...", "caption": "..." }
}
Responda APENAS com o JSON válido, sem blocos de código markdown ou outros textos.`;

            let aiResult;
            try {
                const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
                aiResult = await model.generateContent(prompt);
            } catch (err: any) {
                console.warn(`[Marketing] Gemini 2.5 falhou (${err.message}), caindo para gemini-1.5-flash...`);
                const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
                aiResult = await fallbackModel.generateContent(prompt);
            }
            
            let aiText = aiResult.response.text().trim();
            
            // Limpa formatação markdown caso o modelo tenha ignorado a instrução
            if (aiText.startsWith('```json')) aiText = aiText.replace(/^```json/g, '');
            if (aiText.startsWith('```')) aiText = aiText.replace(/^```/g, '');
            if (aiText.endsWith('```')) aiText = aiText.replace(/```$/g, '');

            const parsedAiContent = JSON.parse(aiText.trim());
            console.log(`[Marketing] Resposta da IA parseada com sucesso!`);

            // Fase 3: Renderização Gráfica (Satori + Sharp)
            console.log(`[Marketing] Iniciando renderização das artes...`);
            const fontBuffer = fs.readFileSync(path.resolve(__dirname, '../../fonts/Inter-SemiBold.ttf'));

            const formats = [
                { name: 'instagram', width: 1080, height: 1080, data: parsedAiContent.instagram },
                { name: 'facebook', width: 1200, height: 630, data: parsedAiContent.facebook },
                { name: 'pinterest', width: 1000, height: 1500, data: parsedAiContent.pinterest }
            ];

            const generatedAssets: Record<string, any> = {};

            for (const format of formats) {
                if (!format.data) continue;
                
                // 1. Gera o SVG do texto com Satori usando estrutura bruta em objeto (VNode)
                const markup = {
                    type: 'div',
                    props: {
                        style: {
                            display: 'flex',
                            width: '100%',
                            height: '100%',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            padding: '80px'
                        },
                        children: {
                            type: 'div',
                            props: {
                                style: {
                                    display: 'flex',
                                    textAlign: 'center',
                                    color: 'white',
                                    fontSize: `${format.width / 16}px`,
                                    lineHeight: 1.4,
                                    fontWeight: 600,
                                    textShadow: '0px 4px 15px rgba(0,0,0,0.8)'
                                },
                                children: `"${format.data.quote}"`
                            }
                        }
                    }
                };

                const svg = await satori(markup as any, {
                    width: format.width,
                    height: format.height,
                    fonts: [{ name: 'Inter', data: fontBuffer, weight: 600, style: 'normal' }],
                });

                // 2. Converte SVG para PNG com Resvg
                const resvg = new Resvg(svg, { fitTo: { mode: 'original' } });
                const textOverlayPng = resvg.render().asPng();

                // 3. Mescla o fundo com o texto usando Sharp
                const finalImageBuffer = await sharp(uploadDestination)
                    .resize(format.width, format.height, { fit: 'cover', position: 'center' })
                    .composite([{ input: textOverlayPng, blend: 'over' }])
                    .png()
                    .toBuffer();

                // Fase 4: Salvamento Local (contornando o erro de bucket inexistente no Firebase)
                const storageFileName = `marketing-${userId}-${randomUUID()}-${format.name}.png`;
                const finalDestination = path.resolve(__dirname, '../../tmp', storageFileName);
                
                fs.writeFileSync(finalDestination, finalImageBuffer);
                
                const publicUrl = `${req.protocol}://${req.hostname}/tmp/${storageFileName}`;

                generatedAssets[format.name] = {
                    imageUrl: publicUrl,
                    caption: format.data.caption
                };
                console.log(`[Marketing] ${format.name} gerado e salvo em: ${publicUrl}`);
            }

            // Grava os dados finais no Firestore
            const docId = randomUUID();
            await db.collection('marketing_assets').doc(docId).set({
                id: docId,
                userId,
                sourceUrl: targetUrl,
                title: title,
                createdAt: new Date().toISOString(),
                assets: generatedAssets
            });
            console.log(`[Marketing] Histórico salvo no Firestore! Doc ID: ${docId}`);

            // Retorno final
            return reply.send({ 
                success: true, 
                message: "Marketing automation complete!",
                assets: generatedAssets,
                title
            });

        } catch (error: any) {
            console.error('[Marketing] Erro ao processar:', error);
            return reply.status(500).send({ 
                error: 'Erro ao extrair o conteúdo do link fornecido.', 
                details: error.message,
                stack: error.stack
            });
        }
    });
}
