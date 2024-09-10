import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import NAV from '../components/Nav';

const Home: NextPage = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>Stake to Meet</title>
        <meta
          content="Stake to Meet"
          name="description"
        />
        <link href="/favicon.ico" rel="icon" />
      </Head>

      <NAV />
      <main className={styles.main}>

        
    <h1 className="text-3xl font-bold underline">
      Hello world!
    </h1>
   </main>

    </div>
  );
};

export default Home;
