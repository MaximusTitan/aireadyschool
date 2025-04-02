"use client";
import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { motion, Variants } from 'framer-motion';
import ThankYouContent from './ThankYouContent';

export default function ThankYouPage() {
    const router = useRouter();

    // Animation for the thank you message
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { duration: 0.5, when: "beforeChildren", staggerChildren: 0.2 }
        }
    };

    // Item variants with proper typing
    const itemVariants: Variants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
    };

    // Direct user to the DATA-AI-Talks website
    const handleBackToHome = () => {
        window.location.href = 'https://app.aireadyschool.com/sign-in';
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center px-4">
            <motion.div
                className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <Suspense fallback={<LoadingState />}>
                    <ThankYouContent 
                        handleBackToHome={handleBackToHome} 
                        itemVariants={itemVariants}
                    />
                </Suspense>
            </motion.div>
        </div>
    );
}

function LoadingState() {
    return (
        <div className="text-center py-8">
            <div className="animate-pulse">
                <div className="h-24 w-56 bg-gray-200 mx-auto mb-6"></div>
                <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-gray-200"></div>
                <div className="h-8 w-48 mx-auto mb-3 bg-gray-200 rounded"></div>
                <div className="h-4 w-64 mx-auto mb-2 bg-gray-200 rounded"></div>
                <div className="h-4 w-56 mx-auto mb-8 bg-gray-200 rounded"></div>
                <div className="h-10 w-32 mx-auto bg-gray-200 rounded"></div>
            </div>
        </div>
    );
}