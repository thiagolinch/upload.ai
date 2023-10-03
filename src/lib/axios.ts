import axios from 'axios'

const api = axios.create({
    baseURL: "https://upload-ai-server-0cf7.onrender.com/"
})

export default api
