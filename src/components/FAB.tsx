"use client";
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import HydrationModal from '@/components/ui/HydrationModal';

const FAB = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="fixed bottom-8 right-8 bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-4 rounded-full shadow-lg z-50"
      >
        <Plus size={24} />
      </button>
      <HydrationModal isOpen={isModalOpen} onClose={handleCloseModal} />
    </>
  );
};

export default FAB;
