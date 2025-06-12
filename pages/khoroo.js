import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import KhorooSambarsPanel from '../components/KhorooSambarsPanel';

const commonButtonStyle = {
  display: 'inline-block',
  padding: '10px 20px',
  backgroundColor: '#007bff',
  color: 'white',
  textDecoration: 'none',
  borderRadius: '4px',
  margin: '10px',
  textAlign: 'center'
};

export default function KhorooView() {
  return (
    <>
      <Head>
        <title>Sambars by Khoroo | Location Manager</title>
        <meta name="description" content="View sambars by khoroo" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '20px'
      }}>
        <header style={{
          marginBottom: '40px',
          borderBottom: '1px solid #eaeaea',
          paddingBottom: '20px'
        }}>
          <h1 style={{
            fontSize: '2rem',
            margin: '0 0 20px 0'
          }}>
            Khoroo Sambars
          </h1>
          
          <nav style={{ marginBottom: '20px' }}>
            <Link href="/" style={commonButtonStyle}>
              Home
            </Link>
            <Link href="/main" style={commonButtonStyle}>
              Map View
            </Link>
          </nav>
        </header>

        <main>
          <KhorooSambarsPanel />
        </main>

        <footer style={{
          marginTop: '40px',
          padding: '20px 0',
          borderTop: '1px solid #eaeaea',
          textAlign: 'center'
        }}>
          <p>
            Location Manager &copy; {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    </>
  );
}
