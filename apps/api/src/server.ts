import 'dotenv/config';
import { fastify } from 'fastify';
import { fastifyCors } from "@fastify/cors"


import { getAllPromtpsRoute } from './routes/get-all-prompts';
import { uploadVideoRoute } from './routes/upload-video';
import { createTranscriptionRoute } from './routes/create-transcription';
import { generateAiCompletionRoute } from './routes/generate-ai-completion';
import { marketingAutomationRoute } from './routes/marketing';

const app = fastify()

app.register(fastifyCors, {
    origin: '*'
  })

app.register(getAllPromtpsRoute)
app.register(uploadVideoRoute)
app.register(createTranscriptionRoute)
app.register(generateAiCompletionRoute)
app.register(marketingAutomationRoute)
const port = Number(process.env.PORT) || 3000

app.listen({ port, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Servidor rodando em ${address}`)
})

// app.listen({
//   port: 5432,
// }).then(() => {
//   console.log("HTTP server running")
// })
