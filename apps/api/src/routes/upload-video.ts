import { FastifyInstance } from "fastify";
import { db } from "../lib/firebase";
import { verifyFirebaseToken } from "../middlewares/auth";

import { randomUUID } from "node:crypto"
import fs from "node:fs"
import { pipeline } from "node:stream";
import { promisify } from "node:util";

import { fastifyMultipart } from "@fastify/multipart"
import path from "path";

const pump = promisify(pipeline)

export async function uploadVideoRoute(app: FastifyInstance) {
    app.register(fastifyMultipart, {
        limits: {
            fieldSize: 1048576 * 35, //35mb
        }
    })
    app.post("/videos", { preHandler: [verifyFirebaseToken] }, async (req, res) => {
        const data = await req.file()

        if(!data) {
            return res.status(400).send({error: "No data"})
        }

        const extencion = path.extname(data.filename)

        if(extencion != '.mp3') {
            return res.status(400).send({error: "Invalid input type!"})
        }

        const fileBasename = path.basename(data.filename, extencion)
        const fileUploadName = `${fileBasename}-${randomUUID()}${extencion}`
        
        // Assegurar que a pasta tmp existe
        const tmpDir = path.resolve(__dirname, '../../tmp')
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true })
        }
        
        const uploadDestination = path.resolve(tmpDir, fileUploadName)

        await pump(data.file, fs.createWriteStream(uploadDestination))
        console.log(uploadDestination)

        const videoId = randomUUID();
        const userId = (req as any).user.uid;
        
        const video = {
            id: videoId,
            name: data.filename,
            path: uploadDestination,
            createdAt: new Date().toISOString(),
            transcription: null,
            userId: userId
        }

        await db.collection("videos").doc(videoId).set(video);

        return {
            video,
        }
    })
}