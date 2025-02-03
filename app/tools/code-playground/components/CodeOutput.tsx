import { motion } from "framer-motion";

interface CodeOutputProps {
  output: string;
}

export default function CodeOutput({ output }: CodeOutputProps) {
  return (
    <motion.div
      className="mt-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3 className="text-lg font-semibold mb-2 ml-2">Output:</h3>
      <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded overflow-x-auto min-h-[100px] text-sm">
        {output || "Run your code to see the output"}
      </pre>
    </motion.div>
  );
}
