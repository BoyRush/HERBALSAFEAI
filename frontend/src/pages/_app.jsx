import '../styles/globals.css';
import { AuthProvider } from '../context/AuthContext';
import Head from 'next/head';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Head>
        <title>HERBALSAFE AI - Medical Recommendations</title>
        <meta name="description" content="Rekomendasi herbal cerdas didukung oleh RAG AI." />
      </Head>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;
