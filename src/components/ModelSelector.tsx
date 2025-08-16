"use client";

import type React from "react";
import { motion } from "framer-motion";
import { Brain, ChevronDown, CheckCircle2, AlertTriangle } from "lucide-react";
import { useModelTraining } from "../context/ModelTrainingContext";

const modelOptions = [
  {
    id: "bert-base-cased",
    name: "BERT Base Cased",
    description: "Currently supported by backend",
    status: "available",
    params: "110M",
    color: "from-green-500 to-emerald-600",
  },
  {
    id: "bert-large-cased",
    name: "BERT Large Cased",
    description: "Future support",
    status: "coming-soon",
    params: "340M",
    color: "from-blue-500 to-cyan-600",
  },
  {
    id: "roberta-base",
    name: "RoBERTa Base",
    description: "Future support",
    status: "coming-soon",
    params: "125M",
    color: "from-purple-500 to-violet-600",
  },
  {
    id: "distilbert-base-cased",
    name: "DistilBERT Base Cased",
    description: "Future support",
    status: "coming-soon",
    params: "66M",
    color: "from-orange-500 to-red-600",
  },
];

export const ModelSelector: React.FC = () => {
  const { selectedModel, setSelectedModel, isTraining } = useModelTraining();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8"
    >
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
          <Brain className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
          Select Model
        </h2>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col">
          <label
            htmlFor="model-select"
            className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3"
          >
            Model Architecture
          </label>

          <div className="relative">
            <select
              id="model-select"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={isTraining}
              className="w-full appearance-none rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60 transition-all duration-200"
            >
              {modelOptions.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} ({model.params})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {selectedModel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {modelOptions.map(
              (model) =>
                model.id === selectedModel && (
                  <motion.div
                    key={model.id}
                    layoutId={`model-${model.id}`}
                    className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${model.color} p-1`}
                  >
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`p-2 bg-gradient-to-r ${model.color} rounded-lg`}
                          >
                            <Brain className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">
                              {model.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {model.params} parameters
                            </p>
                          </div>
                        </div>
                        {model.status === "available" ? (
                          <CheckCircle2 className="h-6 w-6 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-6 w-6 text-amber-500" />
                        )}
                      </div>

                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        {model.description}
                      </p>

                      {model.status === "available" ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs font-medium text-green-600 dark:text-green-400">
                            Ready for training
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                            ⚠️ Backend currently supports bert-base-cased only
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {modelOptions
                .filter((m) => m.id !== selectedModel)
                .map((model, index) => (
                  <motion.div
                    key={model.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => !isTraining && setSelectedModel(model.id)}
                    className={`
                    relative cursor-pointer rounded-xl border-2 border-gray-200 dark:border-gray-700 p-3 transition-all duration-200
                    ${
                      !isTraining
                        ? "hover:border-blue-400 hover:shadow-md"
                        : "opacity-60 cursor-not-allowed"
                    }
                  `}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <div
                        className={`w-3 h-3 rounded-full bg-gradient-to-r ${model.color}`}
                      ></div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {model.name}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {model.params} •{" "}
                      {model.status === "available"
                        ? "Available"
                        : "Coming Soon"}
                    </p>
                  </motion.div>
                ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
