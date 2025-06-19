import '../styles/globals.css';
import '../styles/modal.css';
import '../styles/markers.css';
import Head from 'next/head';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        {/* Add Font Awesome for icons in markers */}
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" 
          integrity="sha512-1ycn6IcaQQ40/MKBW2W4Rhis/DbILU74C1vSrLJxCq57o941Ym01SwNsOMqvEBFlcgUa6xLiPY/NS5R+E6ztJQ==" 
          crossOrigin="anonymous" 
          referrerPolicy="no-referrer" 
        />
        <title>Location Map Application</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
}
