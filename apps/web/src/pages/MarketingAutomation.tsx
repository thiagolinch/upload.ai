import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { ArrowLeft, Image as ImageIcon, Link, UploadCloud, Wand2, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../lib/firebase';

export function MarketingAutomation() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const [url, setUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.currentTarget.files;
    if (files && files[0]) {
      setImageFile(files[0]);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !imageFile) return;

    setIsGenerating(true);
    
    try {
      const token = await auth.currentUser?.getIdToken();
      
      const formData = new FormData();
      formData.append('url', url);
      formData.append('image', imageFile);

      const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      
      const response = await fetch(`${apiURL}/marketing/generate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Falha ao gerar automação de marketing');
      }

      const data = await response.json();
      console.log('Marketing gerado:', data);
      
      alert('Marketing gerado com sucesso! Redirecionando para o seu Histórico...');
      navigate('/app');
      
    } catch (error) {
      console.error(error);
      alert('Ocorreu um erro ao processar sua requisição.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <div className="px-6 py-3 flex items-center justify-between border-b border-zinc-800">
        <h1 className="text-xl font-bold text-zinc-100">Automação de Marketing</h1>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/app/services')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Serviços
          </Button>
          <Button variant="outline" onClick={logout}>Sair</Button>
        </div>
      </div>

      <main className="flex-1 p-6 flex items-center justify-center">
        <form onSubmit={handleGenerate} className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col gap-6 shadow-xl">
          <div className="text-center mb-2">
            <h2 className="text-2xl font-bold text-zinc-100">Criar Ativos Virais</h2>
            <p className="text-zinc-400 mt-2">Nossa IA lerá seu artigo de blog e criará artes e legendas incríveis para as suas redes sociais automaticamente.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url" className="text-zinc-200 font-semibold flex items-center gap-2">
              <Link className="w-4 h-4" /> Link do Artigo (Blog)
            </Label>
            <Textarea 
              id="url"
              placeholder="https://seu-blog.com/artigo..." 
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="resize-none h-14 bg-zinc-950 border-zinc-800 focus-visible:ring-primary text-zinc-100"
              required
            />
          </div>

          <Separator className="bg-zinc-800" />

          <div className="space-y-2">
            <Label className="text-zinc-200 font-semibold flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> Imagem de Fundo Base
            </Label>
            
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileSelected}
            />

            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-32 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-zinc-800 rounded-xl hover:border-primary hover:bg-zinc-800/30 transition-colors text-zinc-400"
            >
              {imageFile ? (
                <>
                  <ImageIcon className="w-8 h-8 text-primary" />
                  <span className="text-zinc-200 font-medium">{imageFile.name}</span>
                  <span className="text-xs text-zinc-500">Clique para trocar a imagem</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-8 h-8" />
                  <span>Clique ou arraste uma imagem aqui</span>
                </>
              )}
            </button>
          </div>

          <Button 
            type="submit" 
            disabled={isGenerating || !url || !imageFile}
            className="w-full mt-4 py-6 text-base font-semibold"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Gerando Ativos Mágicos...
              </>
            ) : (
              <>
                Gerar Ativos Mágicos <Wand2 className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </form>
      </main>
    </div>
  );
}
