import admin from './lib/firebase';

async function checkVideos() {
  const db = admin.firestore();
  const snapshot = await db.collection('videos').orderBy('createdAt', 'desc').limit(5).get();
  console.log(`Found ${snapshot.size} videos.`);
  snapshot.forEach(doc => {
    console.log(doc.id, '=>', doc.data());
  });
}

checkVideos().catch(console.error);
