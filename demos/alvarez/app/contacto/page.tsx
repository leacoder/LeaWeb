import {Suspense} from 'react';
import Contact from '../../components/contact';
export const metadata={title:'Conversemos'};
export default function Page(){return <main id="contenido"><Suspense fallback={<div className="container section">Cargando contacto…</div>}><Contact/></Suspense></main>}
