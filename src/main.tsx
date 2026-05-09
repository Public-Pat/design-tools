import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Home from './routes/Home'
import TypeTool from './routes/TypeTool'
import ImageCollage from './routes/ImageCollage'
import ShapeTool from './routes/ShapeTool'
import './index.css'

const router = createBrowserRouter([
  { path: '/', Component: Home },
  { path: '/type-tool', Component: TypeTool },
  { path: '/image-collage', Component: ImageCollage },
  { path: '/shape-tool', Component: ShapeTool },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
