import { FastifyInstance } from "fastify";
import { db } from "../lib/firebase";

export async function getAllPromtpsRoute(app: FastifyInstance) {
    app.get("/prompts", async () => {
        const snapshot = await db.collection("prompts").get()
        const prompts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))
        return prompts
    })
}