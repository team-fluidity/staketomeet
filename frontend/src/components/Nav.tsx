import { ConnectButton } from "@rainbow-me/rainbowkit";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState, useEffect } from "react";
import Link from "next/link";

const Header = () => {
  const [navbarOpen, setNavbarOpen] = useState(false);
  const [animateHeader, setAnimateHeader] = useState(false);

  useEffect(() => {
    const listener = () => {
      if (window.scrollY > 180) {
        setAnimateHeader(true);
      } else {
        setAnimateHeader(false);
      }
    };
    window.addEventListener("scroll", listener);

    return () => {
      window.removeEventListener("scroll", listener);
    };
  }, [animateHeader]);

  //OG Nav bar
  //<nav className="flex bg-transparent  py-3 px-1 justify-between w-full items-center  fixed top-0 z-50 "> {/* absolute or fixed*/}

  //was used before
  // <nav
  //     className={`flex bg-black pt-10 pb-10 px-1 w-full justify-between items-center fixed top-0 z-50 duration-500 ease-in-out ${
  //       animateHeader &&
  //       " backdrop-filter backdrop-blur-lg bg-black/25 trasition shadow-xl "
  //     }`}
  //   ></nav>

  return (
    <nav className="bg-[#3d52a0]/80 backdrop-blur-lg shadow-lg fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <Link href="/" className="text-2xl font-bold text-[#ede8f5]">
            Stake to Meet
          </Link>
          <div className="hidden md:flex items-center space-x-4">
            <Link href="https://testnet.snowtrace.io/address/0xAE40A252ad7E2BFc8a86c5f8724d807F5326cd43/contract/43113/code" 
                  className="text-[#ede8f5] hover:text-[#adbbda] transition-colors"
                  target="_blank" 
                  rel="noreferrer">
              Contract
            </Link>
            <ConnectButton showBalance={false} />
          </div>
          <button
            className="md:hidden text-[#ede8f5]"
            onClick={() => setNavbarOpen(!navbarOpen)}
          >
            {navbarOpen ? "Close" : "Menu"}
          </button>
        </div>
        {navbarOpen && (
          <div className="md:hidden py-4">
            <Link href="https://testnet.snowtrace.io/address/0xAE40A252ad7E2BFc8a86c5f8724d807F5326cd43/contract/43113/code" 
                  className="block py-2 text-[#ede8f5] hover:text-[#adbbda] transition-colors"
                  target="_blank" 
                  rel="noreferrer">
              Contract
            </Link>
            <div className="py-2">
              <ConnectButton showBalance={false} />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Header;