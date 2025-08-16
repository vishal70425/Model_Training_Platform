"use client";

import type React from "react";
import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  AlertCircle,
  XCircle,
  Activity,
  Terminal,
  Pause,
} from "lucide-react";
import { useModelTraining } from "../context/ModelTrainingContext";

export const TrainingPanel: React.FC = () => {
  const {
    selectedModel,
    trainingFile,
    validationFile,
    isTraining,
    trainingProgress,
    trainingLogs,
    startTraining,
    error,
  } = useModelTraining();

  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [trainingLogs]);

  const canStartTraining =
    selectedModel && trainingFile && validationFile && !isTraining;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8"
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Training
          </h2>
        </div>

        <motion.button
          whileHover={{ scale: canStartTraining ? 1.05 : 1 }}
          whileTap={{ scale: canStartTraining ? 0.95 : 1 }}
          onClick={startTraining}
          disabled={!canStartTraining}
          className={`
            flex items-center space-x-3 px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200
            ${
              canStartTraining
                ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                : "bg-gray-400 cursor-not-allowed"
            }
          `}
        >
          {isTraining ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
              >
                <Pause size={16} />
              </motion.div>
              <span>Training...</span>
            </>
          ) : (
            <>
              <Play size={16} />
              <span>Start Training</span>
            </>
          )}
        </motion.button>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-start space-x-3 mb-6"
          >
            <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-700 dark:text-red-300">
              <p className="font-semibold">Training Error</p>
              <p className="mt-1">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(!selectedModel || !trainingFile || !validationFile) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-4 flex items-start space-x-3 mb-6"
          >
            <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-700 dark:text-yellow-300">
              <p className="font-semibold">Missing requirements</p>
              <ul className="mt-2 space-y-1">
                {!selectedModel && (
                  <motion.li
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center space-x-2"
                  >
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                    <span>Select a model</span>
                  </motion.li>
                )}
                {!trainingFile && (
                  <motion.li
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center space-x-2"
                  >
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                    <span>Upload training dataset (.txt in CoNLL format)</span>
                  </motion.li>
                )}
                {!validationFile && (
                  <motion.li
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center space-x-2"
                  >
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                    <span>
                      Upload validation dataset (.txt in CoNLL format)
                    </span>
                  </motion.li>
                )}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedModel && trainingFile && validationFile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div>
            <div className="flex justify-between text-sm mb-3">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Training Progress
              </span>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {trainingProgress}%
              </span>
            </div>
            <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${trainingProgress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full relative"
              >
                {isTraining && (
                  <motion.div
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{
                      duration: 1.5,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  />
                )}
              </motion.div>
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Terminal className="h-4 w-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Training Logs
              </h3>
            </div>
            <div
              ref={logContainerRef}
              className="bg-gray-900 dark:bg-black/50 backdrop-blur-sm rounded-2xl p-4 h-64 overflow-y-auto font-mono text-xs border border-gray-700"
            >
              <AnimatePresence>
                {trainingLogs.length > 0 ? (
                  trainingLogs.map((log, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="pb-2 border-b border-gray-800 last:border-b-0"
                    >
                      <span className="text-blue-400 font-semibold">
                        [{new Date().toLocaleTimeString()}]
                      </span>
                      <span className="text-gray-300 ml-2">{log}</span>
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-gray-500 italic text-center py-8"
                  >
                    {isTraining ? (
                      <div className="flex items-center justify-center space-x-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 2,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "linear",
                          }}
                          className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"
                        />
                        <span>Connecting to training server...</span>
                      </div>
                    ) : (
                      "Logs will appear here during training"
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
