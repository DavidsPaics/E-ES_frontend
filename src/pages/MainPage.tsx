import React from 'react';
import MainMenu from '@/components/menu';
import { useEffect } from 'react';
import axios from 'axios';
import { Button } from 'antd';

const MainPage: React.FC = () => {
    const fetchData = () : void => {
      axios.get('https://dummyjson.com/c/2e54-e7fa-487e-835f').then((response) => {
        console.log(response.data);
      })
    }

  useEffect((): void => {
    fetchData();
  }, []);
  
  return (
<div className="min-h-screen flex flex-col">
  {/* Header */}
  <header
     className="fixed top-0 left-0 right-0 w-screen p-4 bg-white/20 backdrop-blur-md shadow-md text-xl font-bold text-center text-white"
     style={{ zIndex: 10 }}
   >
     🏁 Welcome to the Main Page
     </header>

  <div className="flex p-8 gap-8 items-start">
    {/* Sidebar */}
    <div className="p-4 mt-16">
      <MainMenu />
    </div>

    {/* Button */}
    <div className="flex items-center mt-16">
    </div>
  </div>
</div>

  );
};

export default MainPage;
