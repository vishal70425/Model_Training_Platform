"use client";

import type React from "react";
import { useRef, useState } from "react";
import { X, FileText, Upload, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useModelTraining } from "../context/ModelTrainingContext";

export const FileUploader: React.FC = () => {
  const {
    trainingFile,
    validationFile,
    setTrainingFile,
    setValidationFile,
    isTraining,
  } = useModelTraining();

  const trainingFileRef = useRef<HTMLInputElement>(null);
  const validationFileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState<"training" | "validation" | null>(
    null
  );

  const handleTrainingFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setTrainingFile(e.target.files[0]);
    }
  };

  const handleValidationFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      setValidationFile(e.target.files[0]);
    }
  };

  const removeTrainingFile = () => {
    setTrainingFile(null);
    if (trainingFileRef.current) {
      trainingFileRef.current.value = "";
    }
  };

  const removeValidationFile = () => {
    setValidationFile(null);
    if (validationFileRef.current) {
      validationFileRef.current.value = "";
    }
  };

  const handleDragOver = (
    e: React.DragEvent,
    type: "training" | "validation"
  ) => {
    e.preventDefault();
    setDragOver(type);
  };

  const handleDragLeave = () => {
    setDragOver(null);
  };

  const handleDrop = (e: React.DragEvent, type: "training" | "validation") => {
    e.preventDefault();
    setDragOver(null);

    const files = e.dataTransfer.files;
    if (files && files[0] && files[0].type === "text/plain") {
      if (type === "training") {
        setTrainingFile(files[0]);
      } else {
        setValidationFile(files[0]);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8"
    >
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
          <Upload className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
          Upload Dataset Files
        </h2>
      </div>

      <div className="space-y-8">
        <div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Training Dataset (.txt)
            </label>

            <AnimatePresence mode="wait">
              {!trainingFile ? (
                <motion.div
                  key="upload-training"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  onClick={() =>
                    !isTraining && trainingFileRef.current?.click()
                  }
                  onDragOver={(e) => handleDragOver(e, "training")}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, "training")}
                  className={`
                    relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300
                    ${
                      dragOver === "training"
                        ? "border-blue-400 bg-blue-50/50 dark:bg-blue-900/20 scale-105"
                        : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500"
                    }
                    ${
                      isTraining
                        ? "opacity-60 cursor-not-allowed"
                        : "hover:bg-gray-50/50 dark:hover:bg-gray-700/30"
                    }
                  `}
                >
                  <motion.div
                    animate={{
                      y: dragOver === "training" ? -5 : 0,
                      scale: dragOver === "training" ? 1.1 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
                    <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Drop your training file here
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      or click to browse
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      CoNLL format text file
                    </p>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="file-training"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-4 border border-blue-200 dark:border-blue-800"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                      <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate max-w-48">
                        {trainingFile.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(trainingFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                  {!isTraining && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={removeTrainingFile}
                      className="p-2 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <X className="h-5 w-5 text-gray-500 hover:text-red-500 dark:text-gray-400" />
                    </motion.button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <input
              ref={trainingFileRef}
              type="file"
              accept=".txt"
              onChange={handleTrainingFileChange}
              disabled={isTraining}
              className="hidden"
            />
          </motion.div>
        </div>

        <div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Validation Dataset (.txt)
            </label>

            <AnimatePresence mode="wait">
              {!validationFile ? (
                <motion.div
                  key="upload-validation"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  onClick={() =>
                    !isTraining && validationFileRef.current?.click()
                  }
                  onDragOver={(e) => handleDragOver(e, "validation")}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, "validation")}
                  className={`
                    relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300
                    ${
                      dragOver === "validation"
                        ? "border-purple-400 bg-purple-50/50 dark:bg-purple-900/20 scale-105"
                        : "border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500"
                    }
                    ${
                      isTraining
                        ? "opacity-60 cursor-not-allowed"
                        : "hover:bg-gray-50/50 dark:hover:bg-gray-700/30"
                    }
                  `}
                >
                  <motion.div
                    animate={{
                      y: dragOver === "validation" ? -5 : 0,
                      scale: dragOver === "validation" ? 1.1 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
                    <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Drop your validation file here
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      or click to browse
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      CoNLL format text file
                    </p>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="file-validation"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-4 border border-purple-200 dark:border-purple-800"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-xl">
                      <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate max-w-48">
                        {validationFile.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(validationFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                  {!isTraining && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={removeValidationFile}
                      className="p-2 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <X className="h-5 w-5 text-gray-500 hover:text-red-500 dark:text-gray-400" />
                    </motion.button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <input
              ref={validationFileRef}
              type="file"
              accept=".txt"
              onChange={handleValidationFileChange}
              disabled={isTraining}
              className="hidden"
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
