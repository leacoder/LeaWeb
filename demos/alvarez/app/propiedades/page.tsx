import {Suspense} from 'react';
import Catalog from '../../components/catalog';
export const metadata={title:'Encontrá tu propiedad'};
export default function Page(){return <main id="contenido"><Suspense fallback={<div className="container section">Cargando propiedades…</div>}><Catalog/></Suspense></main>}
