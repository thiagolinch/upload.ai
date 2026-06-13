import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
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

interface MarketingData {
  id: string;
  title: string;
  sourceUrl: string;
  createdAt: string;
  assets: Record<string, { imageUrl: string; caption: string }>;
}

export function History() {
  const { user, logout } = useAuth();
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [marketingJobs, setMarketingJobs] = useState<MarketingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [selectedMarketing, setSelectedMarketing] = useState<MarketingData | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'videos' | 'marketing'>('videos');
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchVideos() {
      if (!user) return;
      try {
        setLoading(true);
        if (activeTab === 'videos') {
          const videosRef = collection(db, 'videos');
          const q = query(videosRef, where('userId', '==', user.uid));
          const querySnapshot = await getDocs(q);
          const videosData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as VideoData[];
          videosData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setVideos(videosData);
        } else {
          const marketingRef = collection(db, 'marketing_assets');
          const q = query(marketingRef, where('userId', '==', user.uid));
          const querySnapshot = await getDocs(q);
          const marketingData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MarketingData[];
          marketingData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setMarketingJobs(marketingData);
        }
      } catch (error) {
        console.error("Erro ao buscar histórico:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchVideos();
  }, [user, activeTab]);

  const handleCopy = (text?: string | null) => {
    if (text) {
      navigator.clipboard.writeText(text);
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
            <Button onClick={() => navigate('/app/services')} className="gap-2">
              Acessar Serviços <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex bg-zinc-900 p-1 rounded-lg w-fit border border-zinc-800">
          <button 
            onClick={() => setActiveTab('videos')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${activeTab === 'videos' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Vídeos Analisados
          </button>
          <button 
            onClick={() => setActiveTab('marketing')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${activeTab === 'marketing' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Automações de Marketing
          </button>
        </div>

        {/* Content */}
        <main>
          {loading ? (
            <div className="text-zinc-400 text-center py-12">Carregando histórico...</div>
          ) : (activeTab === 'videos' ? videos.length === 0 : marketingJobs.length === 0) ? (
            <div className="text-center py-20 border border-dashed border-zinc-800 rounded-xl">
              <Video className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <h2 className="text-xl font-medium text-zinc-300">Nenhum histórico encontrado</h2>
              <p className="text-zinc-500 mt-2 mb-6">Acesse os serviços para fazer a sua primeira criação.</p>
              <Button onClick={() => navigate('/app/services')}>
                Acessar Serviços
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeTab === 'videos' && videos.map(video => (
                <div 
                  key={video.id} 
                  onClick={() => setSelectedVideo(video)}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-3 transition-all duration-200 hover:border-primary hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10 cursor-pointer"
                >
                  <h3 className="font-semibold text-zinc-100 truncate" title={video.name}>
                    {video.name}
                  </h3>
                  <div className="text-xs text-zinc-500">
                    {new Date(video.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                  <p className="text-sm text-zinc-400 line-clamp-3 mt-2 flex-1">
                    {video.transcription || "Transcrição pendente ou não gerada."}
                  </p>
                </div>
              ))}
              
              {activeTab === 'marketing' && marketingJobs.map(job => (
                <div 
                  key={job.id} 
                  onClick={() => setSelectedMarketing(job)}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-3 transition-all duration-200 hover:border-primary hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10 cursor-pointer"
                >
                  <h3 className="font-semibold text-zinc-100 truncate" title={job.title}>
                    {job.title}
                  </h3>
                  <div className="text-xs text-zinc-500 flex justify-between">
                    <span>{new Date(job.createdAt).toLocaleDateString('pt-BR')}</span>
                    <span className="text-primary truncate ml-2 max-w-[150px]">{job.sourceUrl}</span>
                  </div>
                  <div className="flex gap-2 mt-3 overflow-hidden rounded-md h-24">
                    {Object.values(job.assets).map((asset, i) => (
                      <img key={i} src={asset.imageUrl} className="object-cover w-full h-full" alt="Asset" />
                    ))}
                  </div>
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
                  onClick={() => handleCopy(selectedVideo.transcription)}
                  className="gap-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copiado!" : "Copiar Transcrição"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Marketing */}
        {selectedMarketing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col gap-6 relative animate-in zoom-in-95 duration-200">
              <button 
                onClick={() => setSelectedMarketing(null)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-100 transition-colors z-10 bg-zinc-900/50 rounded-full p-1"
              >
                <X className="w-8 h-8" />
              </button>
              
              <div>
                <h2 className="text-2xl font-bold text-zinc-100 pr-12">{selectedMarketing.title}</h2>
                <a href={selectedMarketing.sourceUrl} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline truncate block">
                  {selectedMarketing.sourceUrl}
                </a>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(selectedMarketing.assets).map(([platform, asset]) => (
                  <div key={platform} className="flex flex-col gap-3 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                    <h3 className="text-lg font-semibold capitalize text-zinc-200 border-b border-zinc-800 pb-2">{platform}</h3>
                    <div className="relative aspect-square md:aspect-auto md:h-64 rounded-md overflow-hidden bg-zinc-900">
                      <img src={asset.imageUrl} alt={platform} className="w-full h-full object-contain" />
                      <a href={asset.imageUrl} target="_blank" rel="noreferrer" className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded hover:bg-primary transition-colors">Abrir original</a>
                    </div>
                    <Textarea 
                      readOnly 
                      className="min-h-[120px] resize-none text-zinc-300 text-sm p-3 bg-zinc-900 border-zinc-800"
                      value={asset.caption}
                    />
                    <Button variant="secondary" onClick={() => handleCopy(asset.caption)} className="w-full gap-2">
                      <Copy className="w-4 h-4" /> Copiar Legenda
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
