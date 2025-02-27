"use client";
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface ThankYouContentProps {
    handleBackToHome: () => void;
    itemVariants: {
        hidden: object;
        visible: object;
    };
}

export default function ThankYouContent({ handleBackToHome, itemVariants }: ThankYouContentProps) {
    const searchParams = useSearchParams();
    const [schoolName, setSchoolName] = useState('');

    useEffect(() => {
        const school = searchParams?.get('school');
        if (school) {
            setSchoolName(decodeURIComponent(school));
        }
    }, [searchParams]);

    return (
        <>
            <motion.div variants={itemVariants} className="mb-6 flex justify-center">
                <div className="relative h-24 w-56">
                    <Image 
                        src="https://xndjwmkypyilvkyczvbj.supabase.co/storage/v1/object/public/store//DATlogo.avif"
                        alt="DAT Logo"
                        fill
                        style={{ objectFit: 'contain' }}
                        priority
                    />
                </div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="mb-4">
                <svg 
                    className="mx-auto h-16 w-16 text-[#e42467]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="text-3xl font-bold mb-3 text-[#e42467]">
                Thank You!
            </motion.h1>
            
            {schoolName && (
                <motion.p variants={itemVariants} className="text-lg font-medium mb-3 text-gray-700">
                    {schoolName}
                </motion.p>
            )}
            
            <motion.p variants={itemVariants} className="text-gray-600 mb-8">
                Your registration has been successfully submitted. Our team will review your information and contact you shortly.
            </motion.p>
            
            <motion.button
                variants={itemVariants}
                onClick={handleBackToHome}
                className="bg-[#e42467] text-white px-8 py-3 rounded-md hover:bg-opacity-90 transition-colors focus:outline-none focus:ring-2 focus:ring-[#e42467] focus:ring-opacity-50 font-medium"
            >
                Go Back
            </motion.button>
        </>
    );
}
