interface TrainingCallbacks {
  onProgress: (progress: number) => void;
  onLog: (log: string) => void;
  onComplete: (metrics: {
    precision: number;
    recall: number;
    f1: number;
    accuracy: number;
  }) => void;
  onError: (error: string) => void;
}

export const simulateTraining = async ({
  onProgress,
  onLog,
  onComplete,
  onError,
}: TrainingCallbacks) => {
  const API_URL =
    " https://ner-backend-503535519403.asia-south1.run.app/api/train";

  try {
    const trainingFile = (window as any).trainingFile;
    const validationFile = (window as any).validationFile;

    if (!trainingFile || !validationFile) {
      throw new Error("Training and validation files are required");
    }

    const formData = new FormData();
    formData.append("train_file", trainingFile);
    formData.append("val_file", validationFile);

    const response = await fetch(API_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter((line) => line.trim());

      for (const line of lines) {
        try {
          const data = JSON.parse(line);

          switch (data.type) {
            case "progress":
              onProgress(data.pct);
              break;
            case "log":
              if (data.msg) {
                onLog(data.msg);
              } else if (data.data) {
                const logEntries = Object.entries(data.data)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join(", ");
                onLog(logEntries);
              }
              break;
            case "metrics":
              onComplete({
                precision: data.data.eval_precision,
                recall: data.data.eval_recall,
                f1: data.data.eval_f1,
                accuracy: data.data.eval_accuracy,
              });
              break;
            case "error":
              onError(data.msg);
              return;
          }
        } catch (parseError) {
          console.warn("Failed to parse line:", line, parseError);
        }
      }
    }
  } catch (error) {
    console.error("Training error:", error);
    onError(error instanceof Error ? error.message : "Unknown error occurred");
  }
};

export const saveModel = async () => {
  const API_URL =
    " https://ner-backend-503535519403.asia-south1.run.app/api/save-model";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to save model");
    }

    return data;
  } catch (error) {
    console.error("Save model error:", error);
    throw error;
  }
};

export const downloadFile = async (filename: string) => {
  const API_URL = ` https://ner-backend-503535519403.asia-south1.run.app/api/download/${encodeURIComponent(
    filename
  )}`;

  try {
    const response = await fetch(API_URL, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error("Download error:", error);
    throw error;
  }
};
