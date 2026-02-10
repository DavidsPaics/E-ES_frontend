import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

const WebsiteLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white text-[#0A306D]">
      <Navbar />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default WebsiteLayout;
