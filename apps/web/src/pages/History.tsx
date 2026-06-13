import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Video, ArrowRight, X, Copy, Check } from 'lucide-react';

interface VideoData {
  id: string;
  name: string;
  transcription: string | null;
  createdAt: string;
}

export function History() {
  const { user, logout } = useAuth();
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchVideos() {
      if (!user) return;
      try {
        const videosRef = collection(db, 'videos');
        const q = query(
          videosRef,
          where('userId', '==', user.uid),
          // Se orderBy falhar devido a falta de index, remova a linha abaixo
          // orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const videosData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as VideoData[];
        
        // Ordenação manual no frontend caso o orderBy do firestore precise de index
        videosData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setVideos(videosData);
      } catch (error) {
        console.error("Erro ao buscar histórico de vídeos:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchVideos();
  }, [user]);

  const handleCopy = () => {
    if (selectedVideo?.transcription) {
      navigator.clipboard.writeText(selectedVideo.transcription);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-6 flex flex-col items-center">
      <div className="w-full max-w-5xl flex flex-col gap-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-zinc-100">Seu Histórico</h1>
            <p className="text-zinc-400 mt-1">Veja os vídeos que você já enviou e as descrições geradas.</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={logout}>
              Sair
            </Button>
            <Button onClick={() => navigate('/app/upload')} className="gap-2">
              Acessar Serviços <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Content */}
        <main>
          {loading ? (
            <div className="text-zinc-400 text-center py-12">Carregando histórico...</div>
          ) : videos.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-zinc-800 rounded-xl">
              <Video className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <h2 className="text-xl font-medium text-zinc-300">Nenhum vídeo enviado ainda</h2>
              <p className="text-zinc-500 mt-2 mb-6">Acesse os serviços para fazer o seu primeiro upload.</p>
              <Button onClick={() => navigate('/app/upload')}>
                Fazer meu primeiro upload
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map(video => (
                <div 
                  key={video.id} 
                  onClick={() => setSelectedVideo(video)}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-3 transition-all duration-200 hover:border-primary hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10 cursor-pointer"
                >
                  <h3 className="font-semibold text-zinc-100 truncate" title={video.name}>
                    {video.name}
                  </h3>
                  <div className="text-xs text-zinc-500">
                    {new Date(video.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                  <p className="text-sm text-zinc-400 line-clamp-3 mt-2 flex-1">
                    {video.transcription || "Transcrição pendente ou não gerada."}
                  </p>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Modal de Transcrição */}
        {selectedVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-2xl shadow-2xl flex flex-col gap-4 relative animate-in zoom-in-95 duration-200">
              <button 
                onClick={() => setSelectedVideo(null)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              <h2 className="text-xl font-bold text-zinc-100 pr-8">{selectedVideo.name}</h2>
              <p className="text-sm text-zinc-500">
                Enviado em {new Date(selectedVideo.createdAt).toLocaleDateString('pt-BR')}
              </p>
              
              <div className="flex-1 mt-2">
                <Textarea 
                  readOnly 
                  className="min-h-[200px] max-h-[60vh] resize-none text-zinc-300 leading-relaxed p-4 bg-zinc-950"
                  value={selectedVideo.transcription || "Nenhuma transcrição foi salva para este vídeo."}
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button 
                  disabled={!selectedVideo.transcription} 
                  onClick={handleCopy}
                  className="gap-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copiado!" : "Copiar Transcrição"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
