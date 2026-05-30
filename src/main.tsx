import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Home from './Pages/Home'
import TypeTool from './Pages/TypeTool'
import ImageCollage from './Pages/ImageCollage'
import ShapeTool from './Pages/ShapeTool'
import BoldTypeLogo from './Pages/BoldTypeLogo'
import './index.css'

const router = createBrowserRouter([
  { path: '/', Component: Home },
  { path: '/type-tool', Component: TypeTool },
  { path: '/image-collage', Component: ImageCollage },
  { path: '/shape-tool', Component: ShapeTool },
  { path: '/bold-type-logo', Component: BoldTypeLogo },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
