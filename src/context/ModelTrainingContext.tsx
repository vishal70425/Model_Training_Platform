"use client";

import type React from "react";
import { createContext, useContext, useState, type ReactNode } from "react";
import {
  simulateTraining,
  saveModel as saveModelAPI,
} from "../services/trainingService";

interface Metrics {
  precision: number;
  recall: number;
  f1: number;
  accuracy: number;
  modelName: string;
}

interface ModelTrainingContextType {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  trainingFile: File | null;
  setTrainingFile: (file: File | null) => void;
  validationFile: File | null;
  setValidationFile: (file: File | null) => void;
  isTraining: boolean;
  trainingProgress: number;
  trainingLogs: string[];
  trainingComplete: boolean;
  metrics: Metrics;
  isModelSaved: boolean;
  startTraining: () => void;
  saveModel: () => Promise<void>;
  error: string | null;
}

const ModelTrainingContext = createContext<ModelTrainingContextType>({
  selectedModel: "bert-base-cased",
  setSelectedModel: () => {},
  trainingFile: null,
  setTrainingFile: () => {},
  validationFile: null,
  setValidationFile: () => {},
  isTraining: false,
  trainingProgress: 0,
  trainingLogs: [],
  trainingComplete: false,
  metrics: { precision: 0, recall: 0, f1: 0, accuracy: 0, modelName: "" },
  isModelSaved: false,
  startTraining: () => {},
  saveModel: async () => {},
  error: null,
});

export const ModelTrainingProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [selectedModel, setSelectedModel] = useState("bert-base-cased");
  const [trainingFile, setTrainingFile] = useState<File | null>(null);
  const [validationFile, setValidationFile] = useState<File | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingLogs, setTrainingLogs] = useState<string[]>([]);
  const [trainingComplete, setTrainingComplete] = useState(false);
  const [metrics, setMetrics] = useState<Metrics>({
    precision: 0,
    recall: 0,
    f1: 0,
    accuracy: 0,
    modelName: "",
  });
  const [isModelSaved, setIsModelSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startTraining = async () => {
    if (!selectedModel || !trainingFile || !validationFile || isTraining) {
      setError(
        "Please ensure all fields are filled and training is not already in progress"
      );
      return;
    }

    setIsTraining(true);
    setTrainingProgress(0);
    setTrainingLogs([]);
    setTrainingComplete(false);
    setIsModelSaved(false);
    setError(null);

    const fileSuffix = trainingFile.name.split(".")[0].split("_")[0];
    const today = new Date();
    const dateStr = `${today.getDate().toString().padStart(2, "0")}-${(
      today.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}-${today.getFullYear()}`;

    const modelName = `${selectedModel}_${dateStr}_${fileSuffix}`;
    (window as any).trainingFile = trainingFile;
    (window as any).validationFile = validationFile;
    await simulateTraining({
      onProgress: (progress) => {
        setTrainingProgress(progress);
      },
      onLog: (log) => {
        setTrainingLogs((prevLogs) => [...prevLogs, log]);
      },
      onComplete: (results) => {
        setTrainingComplete(true);
        setIsTraining(false);
        setTrainingProgress(100);
        setMetrics({
          ...results,
          modelName,
        });

        if (results.accuracy >= 0.95) {
          setIsModelSaved(true);
          setTrainingLogs((prevLogs) => [
            ...prevLogs,
            `Model accuracy is ${(results.accuracy * 100).toFixed(
              1
            )}% - Auto-saving model`,
            `Saved model to ${modelName}.onnx`,
            `Saved metadata to ${modelName}_metadata.json`,
          ]);
        }
      },
      onError: (errorMsg) => {
        setError(errorMsg);
        setIsTraining(false);
        setTrainingLogs((prevLogs) => [...prevLogs, `Error: ${errorMsg}`]);
      },
    });
  };
  const saveModel = async () => {
    if (!trainingComplete || isModelSaved) {
      return;
    }

    try {
      setError(null);
      setTrainingLogs((prevLogs) => [...prevLogs, "Manually saving model..."]);

      const result = await saveModelAPI();

      setIsModelSaved(true);
      setTrainingLogs((prevLogs) => [
        ...prevLogs,
        `Model saved successfully!`,
        `Files: ${result.files?.join(", ") || "model files saved"}`,
      ]);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to save model";
      setError(errorMsg);
      setTrainingLogs((prevLogs) => [...prevLogs, `Save error: ${errorMsg}`]);
    }
  };

  return (
    <ModelTrainingContext.Provider
      value={{
        selectedModel,
        setSelectedModel,
        trainingFile,
        setTrainingFile,
        validationFile,
        setValidationFile,
        isTraining,
        trainingProgress,
        trainingLogs,
        trainingComplete,
        metrics,
        isModelSaved,
        startTraining,
        saveModel,
        error,
      }}
    >
      {children}
    </ModelTrainingContext.Provider>
  );
};

export const useModelTraining = () => {
  const context = useContext(ModelTrainingContext);
  if (!context) {
    throw new Error(
      "useModelTraining must be used within a ModelTrainingProvider"
    );
  }
  return context;
};
