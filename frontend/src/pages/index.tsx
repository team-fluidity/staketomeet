import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import NAV from '../components/Nav';
import FLOW from '../components/Flow';

const Home: NextPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3d52a0] to-[#7091e6]">
      <Head>
        <title>Stake to Meet</title>
        <meta content="Stake to Meet" name="description" />
        <link href="/favicon.ico" rel="icon" />
      </Head>

      <NAV />
      <main className="container mx-auto px-4 py-8">
        <FLOW />
      </main>
    </div>
  );
};

export default Home;
