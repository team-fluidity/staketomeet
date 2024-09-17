import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const WalletConnect: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-[#8697c4]/80 backdrop-blur-lg shadow-lg rounded-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-6">Welcome to Stake to Meet</h1>
        <h2 className="text-2xl font-semibold text-center mb-4">Get PAID for your time</h2>
        <p className="text-center mb-6">To get started, please connect your wallet</p>
        <div className="flex justify-center">
          <ConnectButton />
        </div>
      </div>
    </div>
  );
};

export default WalletConnect;