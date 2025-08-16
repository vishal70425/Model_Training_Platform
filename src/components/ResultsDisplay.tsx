import type React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save,
  CheckCircle,
  DownloadCloud,
  AlertTriangle,
  Trophy,
  Target,
  Zap,
  TrendingUp,
} from "lucide-react";
import { useModelTraining } from "../context/ModelTrainingContext";
import { downloadFile } from "../services/trainingService";
import { useState } from "react";

export const ResultsDisplay: React.FC = () => {
  const { trainingComplete, metrics, isModelSaved, saveModel, error } =
    useModelTraining();
  const [downloadingFiles, setDownloadingFiles] = useState<string[]>([]);

  const handleDownload = async (filename: string) => {
    try {
      setDownloadingFiles((prev) => [...prev, filename]);
      await downloadFile(filename);
      console.log(`Successfully downloaded ${filename}`);
    } catch (error) {
      console.error(`Failed to download ${filename}:`, error);
      alert(`Failed to download ${filename}. Please try again.`);
    } finally {
      setDownloadingFiles((prev) => prev.filter((f) => f !== filename));
    }
  };

  if (!trainingComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Results
          </h2>
        </div>

        <div className="text-center py-12">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center"
          >
            <Trophy className="h-8 w-8 text-white" />
          </motion.div>
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            Results will appear here after training completes
          </p>
        </div>
      </motion.div>
    );
  }

  const metricsData = [
    {
      name: "Precision",
      value: metrics.precision,
      color: "from-blue-500 to-cyan-500",
      icon: Target,
      description: "Accuracy of positive predictions",
    },
    {
      name: "Recall",
      value: metrics.recall,
      color: "from-green-500 to-emerald-500",
      icon: Zap,
      description: "Ability to find all positive cases",
    },
    {
      name: "F1 Score",
      value: metrics.f1,
      color: "from-purple-500 to-violet-500",
      icon: TrendingUp,
      description: "Harmonic mean of precision and recall",
    },
    {
      name: "Accuracy",
      value: metrics.accuracy,
      color: "from-yellow-500 to-orange-500",
      icon: Trophy,
      description: "Overall correctness of the model",
    },
  ];

  const isHighAccuracy = metrics.accuracy >= 0.95;
  const onnxFileName = `${metrics.modelName || "model"}.onnx`;
  const metadataFileName = `${metrics.modelName || "model"}_metadata.json`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8"
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Training Results
          </h2>
        </div>

        <AnimatePresence>
          {!isModelSaved && (
            <>
              {isHighAccuracy ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center text-green-600 dark:text-green-400 text-sm font-medium bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-xl"
                >
                  <CheckCircle size={16} className="mr-2" />
                  <span>Auto-saved (High Accuracy)</span>
                </motion.div>
              ) : (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={saveModel}
                  className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium transition-all duration-200 shadow-lg"
                >
                  <Save size={16} />
                  <span>Save Model</span>
                </motion.button>
              )}
            </>
          )}

          {isModelSaved && !isHighAccuracy && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center text-green-600 dark:text-green-400 text-sm font-medium bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-xl"
            >
              <CheckCircle size={16} className="mr-2" />
              <span>Model Saved</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {metrics.accuracy < 0.8 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-start space-x-3 mb-6"
          >
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-700 dark:text-amber-300">
              <p className="font-semibold">Low Accuracy Warning</p>
              <p className="mt-1">
                Consider training for more epochs or using a larger dataset.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        {metricsData.map((metric, index) => (
          <motion.div
            key={metric.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 p-6 border border-gray-200/50 dark:border-gray-600/50"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div
                  className={`p-2 bg-gradient-to-r ${metric.color} rounded-xl`}
                >
                  <metric.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                    {metric.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {metric.description}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(metric.value * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="relative h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${metric.value * 100}%` }}
                transition={{
                  duration: 1,
                  delay: index * 0.2,
                  ease: "easeOut",
                }}
                className={`h-full bg-gradient-to-r ${metric.color} rounded-full`}
              />
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {(isModelSaved || isHighAccuracy) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700/50 dark:to-blue-900/20 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
          >
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
              <DownloadCloud className="h-5 w-5 mr-2 text-blue-500" />
              Exported Model Files
            </h3>
            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {onnxFileName}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">
                    ONNX Model
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDownload(onnxFileName)}
                    disabled={downloadingFiles.includes(onnxFileName)}
                    className="p-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg transition-colors"
                    title="Download ONNX model"
                  >
                    {downloadingFiles.includes(onnxFileName) ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "linear",
                        }}
                      >
                        <DownloadCloud size={16} />
                      </motion.div>
                    ) : (
                      <DownloadCloud size={16} />
                    )}
                  </motion.button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {metadataFileName}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">
                    Label Mappings
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDownload(metadataFileName)}
                    disabled={downloadingFiles.includes(metadataFileName)}
                    className="p-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white rounded-lg transition-colors"
                    title="Download metadata file"
                  >
                    {downloadingFiles.includes(metadataFileName) ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "linear",
                        }}
                      >
                        <DownloadCloud size={16} />
                      </motion.div>
                    ) : (
                      <DownloadCloud size={16} />
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
              Click the download buttons to save files to your computer
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
