import { Layout } from "./components/Layout";
import { ModelSelector } from "./components/ModelSelector";
import { FileUploader } from "./components/FileUploader";
import { TrainingPanel } from "./components/TrainingPanel";
import { ResultsDisplay } from "./components/ResultsDisplay";
import { ModelTrainingProvider } from "./context/ModelTrainingContext";
import { ThemeProvider } from "./components/ThemeProvider";

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="nlp-trainer-theme">
      <ModelTrainingProvider>
        <Layout>
          <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
            <h1 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
              NLP Model Training Platform
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <ModelSelector />
                <FileUploader />
              </div>

              <div className="space-y-6">
                <TrainingPanel />
                <ResultsDisplay />
              </div>
            </div>
          </div>
        </Layout>
      </ModelTrainingProvider>
    </ThemeProvider>
  );
}

export default App;
