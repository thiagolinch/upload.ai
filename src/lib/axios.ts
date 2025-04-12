import axios from 'axios'

const api = axios.create({
    baseURL: "https://upload-ai-server-6si4.onrender.com"
})

export default api
