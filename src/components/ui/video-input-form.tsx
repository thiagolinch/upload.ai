import { FileVideo, Upload } from "lucide-react";
import { Separator } from "./separator";
import { Label } from "./label";
import { Textarea } from "./textarea";
import { Button } from "./button";
import { ChangeEvent, useMemo, useRef, useState } from "react";

import { getFFmpeg } from "@/lib/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import api from "@/lib/axios";

type Status = 'waiting' | 'converting' | 'uploading' | 'generating' | 'sucessess'

export function VideoInputForm() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("waiting")


  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const { files } = event.currentTarget

    if(!files) {
      return
    }

    const selectedFile = files[0]

    setVideoFile(selectedFile)
  }

  async function convertVideoToAudio(video: File) {
    console.log('converter started')

    const ffmpeg = await getFFmpeg()

    await ffmpeg.writeFile('input.mp4', await fetchFile(video))

    //ffmpeg.on('log', log => {
    // console.log(log)
    //})

    ffmpeg.on('progress', progress => {
      console.log('convert progress:' + Math.round(progress.progress * 100))
    })

    await ffmpeg.exec([
      '-i',
      'input.mp4',
      '-map',
      '0:a',
      '-b:a',
      '20k',
      '-acodec',
      'libmp3lame',
      'output.mp3'
    ])

    const data = await ffmpeg.readFile('output.mp3')

    const audioFileBlob = new Blob([data], {type: 'audio/mpeg'})
    const audioFile = new File([audioFileBlob], 'audio.mp3')

    console.log('Convert fished')

    return audioFile

  }

  async function handleUploadVideo(event: ChangeEvent<HTMLFormElement>) {
    event.preventDefault()

    const prompt = promptInputRef.current?.value

    if(!videoFile){
      return
    }

    // converter video em audio
    const audioFile = await convertVideoToAudio(videoFile)
    console.log(audioFile)


    const data =new FormData()

    data.append('file', audioFile)

    const response = await api.post('/videos', data)
    console.log(response)

    const videoId = response.data.video.id
    console.log(videoId)

    await api.post(`/videos/${videoId}/transcription`, {
      prompt,
    })

    console.log('finalizou')
    console.log(videoId)

  }

  const previewULR = useMemo(() => {
    if(!videoFile){
      return null
    }

    return URL.createObjectURL(videoFile)
  }, [videoFile])


  return (
      <form onSubmit={handleUploadVideo} className="space-y-6">
          <label
            htmlFor="video"
            className="border relative flex rodded-md aspect-video cursor-pointer border-dashed text-sm flex-col gap-2 items-center justify-center text-muted-foreground hover:bg-primary/5"
          >
            {previewULR ? (
              <video src={previewULR} controls={false} className="pointer-events-none absolute inset-0" />
            ) : (
              <>
                <FileVideo w-4 h-4 />
                Selecione um vídeo
              </>
            )}
          </label>

          <input type="file" id="video" accept="video/mp4" className="sr-only" onChange={handleFileSelected} />

          <Separator />

          <div>
            <Label htmlFor="transcription_prompt">Prompt de transcrição</Label>
            <Textarea
              ref={promptInputRef}
              id="transcription_prompt"
              className="h-20 leading-relaxed resize-none"
              placeholder="Inclua palavras-chave mencionadas no vídeo separadas por vírgula (,)"
            />
          </div>

          <Button type="submit" className="w-full" >
            Carregar video
            <Upload className="w-4 h-4 ml-2" />
          </Button>
      </form>
  )
}