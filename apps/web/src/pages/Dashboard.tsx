import { Github, Wand2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { VideoInputForm } from "../components/video-input-form";
import { PromptSelect } from "../components/prompt-select";
import { useState, useEffect } from "react";

import { useCompletion } from 'ai/react';

import { useAuth } from "../contexts/AuthContext";
import { auth } from "../lib/firebase";
import { useNavigate } from "react-router-dom";

export function Dashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [videoId, setVideoId] = useState<String | null>(null)
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    auth.currentUser?.getIdToken().then(setToken);
  }, []);

  //function handlePromptSelected(template: string) {
  //  console.log(template)
  //}

  const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  const {
    // input,
    setInput,
    // handleInputChange,
    handleSubmit,
    completion,
    isLoading
  } = useCompletion({
    api: `${apiURL}/ai/complete`,
    body: {
      videoId
    },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  })

  return (
    <div className=" min-h-screen flex flex-col">
      <div className="px-6 py-3 flex items-center justify-between border-b">
        <h1 className="text-xl font-bold">upload.ai</h1>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:inline">Desenvolvido com 💜</span>
          <Button variant={"ghost"} onClick={() => navigate('/app')}>
            Histórico
          </Button>
          <Button variant={"outline"} onClick={logout}>
            Sair
          </Button>
          <Button variant={"outline"}>
            <Github className="mr-2 h-4 w-4 " />
            GitHub
          </Button>
        </div>


      </div>

      <main className="flex-1 p-4 md:p-6 flex flex-col md:flex-row gap-6">
        <div className="flex flex-col flex-1 gap-4 order-2 md:order-1">
          <div className="flex flex-col gap-4 flex-1 min-h-[300px] md:min-h-0">
            {/* <Textarea
              className="resize-none p-4 leading-relaxed flex-1" 
              placeholder="Inclua o prompt para a IA..." 
              value={input}
              onChange={handleInputChange}
            /> */}
            <Textarea
              className="resize-none p-4 leading-relaxed flex-1"
              placeholder="Resultado gerado pela IA..."
              readOnly
              value={completion}
            />
          </div>
        </div>

        <aside className="w-full md:w-80 shrink-0 space-y-6 order-1 md:order-2">
          <VideoInputForm onVideoUploaded={setVideoId} />

          <Separator />

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Prompt</Label>
              <PromptSelect onPromptSelected={setInput} />
            </div>

            <Button disabled={isLoading} type="submit" className="w-full">
              Executar
              <Wand2 className="w-4 h-4 ml-2" />
            </Button>

            <Separator />
          </form>
        </aside>
      </main>
    </div>
  )
}
