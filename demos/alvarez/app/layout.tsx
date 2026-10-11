import type { Metadata } from 'next';
import './globals.css';
import { Header, Footer, DemoProvider } from '../components/ui';
export const metadata: Metadata = { title: {default:'Álvarez Propiedades | Tu próximo lugar, en Avellaneda', template:'%s | Álvarez Propiedades'}, description:'Demo de diseño para Álvarez Propiedades. Venta, alquiler y tasaciones en Avellaneda. Avisos de referencia y propiedades de muestra.', robots:{index:false,follow:false,noarchive:true}, icons:{icon:'/demo/alvarezinmobiliaria/favicon.svg'} };
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="es-AR"><body><DemoProvider><a href="#contenido" className="skip">Saltar al contenido</a><Header/>{children}<Footer/></DemoProvider></body></html>}
