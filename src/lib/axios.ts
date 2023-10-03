import axios from 'axios'

const api = axios.create({
    baseURL: "https://upload-ai-server-sepia.vercel.app/"
})

export default api
