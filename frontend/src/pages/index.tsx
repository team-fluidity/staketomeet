import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import NAV from '../components/Nav';
import INTRO from '../components/Intro';
import SCHEDULE from '../components/Schedule';
import FLOW from '../components/Flow';

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
      <FLOW />

    </div>
  );
};

export default Home;
