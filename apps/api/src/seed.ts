import { db } from './lib/firebase';
import { randomUUID } from 'node:crypto';
import 'dotenv/config';

const prompts = [
  {
    title: 'Título do YouTube',
    template: `Seu papel é gerar três títulos alternativos para um vídeo do YouTube a partir da transcrição fornecida abaixo.

Requisitos:
- Cada título deve ter no máximo 60 caracteres.
- Os títulos devem ser chamativos, atraentes e despertar a curiosidade para aumentar o CTR (taxa de cliques).
- Retorne apenas os três títulos em uma lista numerada.

Transcrição:
'''
{transcription}
'''`
  },
  {
    title: 'Descrição do YouTube',
    template: `Seu papel é gerar uma descrição detalhada e otimizada para um vídeo do YouTube a partir da transcrição fornecida abaixo.

Requisitos:
- A descrição deve ter no máximo 3 parágrafos curtos.
- Identifique e inclua as principais palavras-chave abordadas no conteúdo.
- Use um tom informal, dinâmico e amigável para engajar os espectadores.
- Opcionalmente, inclua sugestões de hashtags relevantes ao final da descrição.

Transcrição:
'''
{transcription}
'''`
  }
];

async function seed() {
  console.log('Iniciando semeação de prompts no Firestore...');

  try {
    const promptsCollection = db.collection('prompts');
    
    // Limpar prompts antigos antes de semear
    const snapshot = await promptsCollection.get();
    for (const doc of snapshot.docs) {
      await doc.ref.delete();
    }
    
    for (const prompt of prompts) {
      const id = randomUUID();
      await promptsCollection.doc(id).set({
        title: prompt.title,
        template: prompt.template
      });
      console.log(`Prompt "${prompt.title}" cadastrado com ID: ${id}`);
    }

    console.log('Semeação concluída com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('Erro ao semear banco de dados:', error);
    process.exit(1);
  }
}

seed();
