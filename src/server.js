import { initServer } from './app.js'
import { connectDB } from './config/mongoose.js'

await connectDB()
const app = await initServer()

export const server = app.listen(process.env.PORT, () => {
  console.log(`Server running at http://localhost:${process.env.PORT}`)
  console.log('Press Ctrl-C to terminate...')
})

