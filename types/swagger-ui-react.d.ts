declare module 'swagger-ui-react' {
  import { ComponentType } from 'react'
  
  interface SwaggerUIProps {
    url?: string
    spec?: object
    [key: string]: any
  }
  
  const SwaggerUI: ComponentType<SwaggerUIProps>
  export default SwaggerUI
}

declare module 'swagger-ui-react/swagger-ui.css'
