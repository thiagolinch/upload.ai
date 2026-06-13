import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Video, Image as ImageIcon, ArrowLeft } from 'lucide-react';

export function ServicesHub() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-950 p-6 flex flex-col items-center">
      <div className="w-full max-w-5xl flex flex-col gap-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-zinc-100">Hub de Serviços</h1>
            <p className="text-zinc-400 mt-1">Escolha qual ferramenta de IA você deseja utilizar hoje.</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/app')}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Histórico
            </Button>
            <Button variant="outline" onClick={logout}>
              Sair
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Card: Vídeos */}
          <div 
            onClick={() => navigate('/app/upload')}
            className="group relative bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col gap-4 cursor-pointer transition-all hover:border-primary hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 overflow-hidden"
          >
            <div className="w-16 h-16 rounded-xl bg-zinc-800/50 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <Video className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-100 mt-2">Vídeo para Texto</h2>
            <p className="text-zinc-400 leading-relaxed">
              Faça o upload de seus vídeos e nossa IA irá gerar automaticamente títulos atrativos e descrições para YouTube, Instagram e TikTok baseados no áudio.
            </p>
          </div>

          {/* Card: Marketing */}
          <div 
            onClick={() => navigate('/app/marketing')}
            className="group relative bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col gap-4 cursor-pointer transition-all hover:border-primary hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 overflow-hidden"
          >
            <div className="w-16 h-16 rounded-xl bg-zinc-800/50 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <ImageIcon className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-100 mt-2">Automação de Marketing</h2>
            <p className="text-zinc-400 leading-relaxed">
              Transforme URLs de artigos de blog em dezenas de artes visuais e copys para redes sociais usando Inteligência Artificial.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
