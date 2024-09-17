/* eslint-disable react/no-unescaped-entities */
import React from "react";

const Loading = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-[#ede8f5] animate-pulse">
          Loading...
        </h2>
      </div>
    </div>
  );
};

export default Loading;