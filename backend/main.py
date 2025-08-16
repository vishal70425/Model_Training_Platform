import os
import json
import tempfile
import numpy as np
import torch
import onnx
import logging
import uvicorn
from queue import Queue
import threading
from datetime import datetime
from fastapi import FastAPI, UploadFile, File,HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse,FileResponse
from torch.utils.data import Dataset, DataLoader
from transformers import (
    AutoTokenizer,
    AutoModelForTokenClassification,
    TrainingArguments,
    Trainer,
    DataCollatorForTokenClassification,
    TrainerCallback,
    TrainerState,
    TrainerControl
)
from seqeval.metrics import precision_score, recall_score, f1_score, accuracy_score

# ── Logging ─────────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── FastAPI ─────────────────────────────────────────────────────────────────────
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"]
)

# ── Directories ─────────────────────────────────────────────────────────────────
BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
RESULTS_DIR = os.path.join(BASE_DIR, "results")
os.makedirs(RESULTS_DIR, exist_ok=True)
logger.info(f"RESULTS_DIR: {RESULTS_DIR}")

# ── Globals ─────────────────────────────────────────────────────────────────────
last_train_filename: str = None
last_val_filename: str   = None
last_model     = None
last_tokenizer = None
label2id       = None
id2label       = None
last_metrics   = None

# ── Preload tokenizer & base checkpoint ─────────────────────────────────────────
MODEL_NAME     = "bert-base-cased"
GLOBAL_TOKENIZER = AutoTokenizer.from_pretrained(MODEL_NAME, use_fast=True)
# Dummy model; we'll re-init per-call with correct num_labels
GLOBAL_MODEL   = AutoModelForTokenClassification.from_pretrained(MODEL_NAME)
device         = torch.device("cuda" if torch.cuda.is_available() else "cpu")
GLOBAL_MODEL.to(device)
logger.info(f"Using device: {device}")

# ── Utility functions ───────────────────────────────────────────────────────────
def load_conll_dataset(path: str):
    sentences, labels = [], []
    toks, labs = [], []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                parts = line.split()
                if len(parts) >= 2:
                    toks.append(parts[0]); labs.append(parts[-1])
            else:
                if toks:
                    sentences.append(toks); labels.append(labs)
                    toks, labs = [], []
    if toks:
        sentences.append(toks); labels.append(labs)
    return sentences, labels

class NERDataset(Dataset):
    def __init__(self, sents, labs, tokenizer, label2id, max_len=128):
        self.sents      = sents
        self.labs       = labs
        self.tokenizer  = tokenizer
        self.label2id   = label2id
        self.max_len    = max_len
    def __len__(self): return len(self.sents)
    def __getitem__(self, i):
        tokens = self.tokenizer(
            self.sents[i],
            is_split_into_words=True,
            padding="max_length",
            truncation=True,
            max_length=self.max_len,
            return_tensors="pt"
        )
        wids = tokens.word_ids(0)
        lbl = []; prev = None
        for w in wids:
            if w is None: lbl.append(-100)
            elif w!=prev: lbl.append(self.label2id[self.labs[i][w]])
            else: lbl.append(-100)
            prev = w
        tokens["labels"] = torch.tensor(lbl)
        return {k:v.squeeze(0) for k,v in tokens.items()}

def compute_metrics(pl):
    preds, labs = pl
    preds = np.argmax(preds, axis=-1)
    tp, tl = [], []
    for p, l in zip(preds, labs):
        tp.append([id2label[pp] for pp,ll in zip(p,l) if ll!=-100])
        tl.append([id2label[ll] for pp,ll in zip(p,l) if ll!=-100])
    return {
        "precision": precision_score(tl,tp),
        "recall":    recall_score(tl,tp),
        "f1":        f1_score(tl,tp),
        "accuracy":  accuracy_score(tl,tp),
    }

def export_to_onnx(model, tokenizer, out_dir, filename):
    os.makedirs(out_dir, exist_ok=True)
    model.eval().to(device)
    dummy_ids  = torch.ones(1, 128, dtype=torch.long).to(device)
    dummy_mask = torch.ones(1, 128, dtype=torch.long).to(device)
    dummy_tids = torch.zeros(1, 128, dtype=torch.long).to(device)
    onnx_path  = os.path.join(out_dir, filename)
    torch.onnx.export(
        model,
        (dummy_ids, dummy_mask, dummy_tids),
        onnx_path,
        input_names=["input_ids", "attention_mask", "token_type_ids"],
        output_names=["logits"],
        dynamic_axes={
            "input_ids": {0: "batch", 1: "seq"},
            "attention_mask": {0: "batch", 1: "seq"},
            "token_type_ids": {0: "batch", 1: "seq"},
            "logits": {0: "batch", 1: "seq"}
        },
        opset_version=14
    )
    meta = {"label2id": label2id, "id2label": id2label}
    json_path = os.path.join(out_dir, filename.replace('.onnx', '_metadata.json'))
    with open(json_path, "w") as f:
        json.dump(meta, f, indent=2)
    onnx.checker.check_model(onnx.load(onnx_path))
    logger.info(f"Exported ONNX model to {onnx_path} and metadata to {json_path}")
    return onnx_path

# ── Streaming Callback ──────────────────────────────────────────────────────────
class StreamCallback(TrainerCallback):
    def __init__(self, emit):
        super().__init__()
        self.emit = emit

    def on_log(self, args, state: TrainerState, control: TrainerControl, logs=None, **kwargs):
        """Emit logs at each logging step."""
        if logs:
            self.emit({"type": "log", "data": logs})

    def on_epoch_end(self, args, state: TrainerState, control: TrainerControl, **kwargs):
        """Emit progress and log messages at the end of each epoch."""
        pct = int((state.epoch / state.num_train_epochs) * 100)
        self.emit({"type": "progress", "pct": pct})
        self.emit({"type": "log", "msg": f"Completed epoch {int(state.epoch)}/{state.num_train_epochs}"})

# ── Custom Trainer to force num_workers>0, no prefetch_factor ──────────────────
class CustomTrainer(Trainer):
    def get_train_dataloader(self):
        return DataLoader(
            self.train_dataset,
            batch_size=self.args.per_device_train_batch_size,
            shuffle=True,
            collate_fn=self.data_collator,
            num_workers=2
        )
    def get_eval_dataloader(self, eval_dataset=None):
        eval_dataset = eval_dataset or self.eval_dataset
        return DataLoader(
            eval_dataset,
            batch_size=self.args.per_device_eval_batch_size,
            shuffle=False,
            collate_fn=self.data_collator,
            num_workers=2
        )

# ── /api/train ──────────────────────────────────────────────────────────────────
@app.post("/api/train")
async def train_endpoint(
    train_file: UploadFile=File(...),
    val_file: UploadFile=File(...)
):
    global last_model, last_tokenizer, label2id, id2label, last_metrics
    global last_train_filename, last_val_filename

    try:
        last_train_filename = train_file.filename
        last_val_filename = val_file.filename

        # 1) Write to temporary files
        with tempfile.TemporaryDirectory() as td:
            tpath = os.path.join(td, "train.txt")
            vpath = os.path.join(td, "val.txt")
            open(tpath, "wb").write(await train_file.read())
            open(vpath, "wb").write(await val_file.read())
            tr_s, tr_l = load_conll_dataset(tpath)
            vl_s, vl_l = load_conll_dataset(vpath)

        # 2) Build labels
        uniq = sorted({lab for labs in tr_l + vl_l for lab in labs})
        label2id = {l: i for i, l in enumerate(uniq)}
        id2label = {i: l for l, i in label2id.items()}
        logger.info(f"Labels: {uniq}")

        # 3) Initialize model
        mdl = GLOBAL_MODEL.__class__.from_pretrained(
            MODEL_NAME,
            num_labels=len(uniq),
            label2id=label2id,
            id2label=id2label
        ).to(device)
        last_model = mdl
        last_tokenizer = GLOBAL_TOKENIZER

        # 4) Create datasets
        ds_tr = NERDataset(tr_s, tr_l, GLOBAL_TOKENIZER, label2id)
        ds_vl = NERDataset(vl_s, vl_l, GLOBAL_TOKENIZER, label2id)

        # 5) Define training arguments
        epochs = 2
        args = TrainingArguments(
            output_dir=RESULTS_DIR,
            num_train_epochs=epochs,
            per_device_train_batch_size=16,
            per_device_eval_batch_size=16,
            eval_strategy="epoch",
            save_strategy="no",
            learning_rate=2e-5,
            weight_decay=0.01,
            logging_steps=10,
            fp16=torch.cuda.is_available()
        )

        # 6) Set up queue and callback for streaming
        log_queue = Queue()

        def emit(msg):
            log_queue.put(msg)

        callback = StreamCallback(emit)

        # 7) Define training function to run in a separate thread
        def train_function():
            global last_metrics
            try:
                trainer = CustomTrainer(
                    model=mdl,
                    args=args,
                    train_dataset=ds_tr,
                    eval_dataset=ds_vl,
                    tokenizer=GLOBAL_TOKENIZER,
                    data_collator=DataCollatorForTokenClassification(GLOBAL_TOKENIZER),
                    compute_metrics=compute_metrics,
                    callbacks=[callback]
                )
                logger.info("Starting training...")
                trainer.train()
                logger.info("Evaluating...")
                metrics = trainer.evaluate()
                last_metrics = metrics
                logger.info(f"Evaluation done: {metrics}")

                # Filter metrics
                filtered_metrics = {
                    "eval_precision": metrics.get("eval_precision", 0.0),
                    "eval_recall": metrics.get("eval_recall", 0.0),
                    "eval_f1": metrics.get("eval_f1", 0.0),
                    "eval_accuracy": metrics.get("eval_accuracy", 0.0)
                }

                # Auto-save if accuracy >= 0.95
                if filtered_metrics["eval_accuracy"] >= 0.95:
                    date_str = datetime.now().strftime('%d-%m-%Y')
                    stem = os.path.splitext(os.path.basename(last_train_filename))[0]
                    first_word = stem.split('_')[0]
                    filename = f"{MODEL_NAME}_{date_str}_{first_word}.onnx"
                    onnx_path = export_to_onnx(mdl, GLOBAL_TOKENIZER, RESULTS_DIR, filename)
                    logger.info(f"Auto-saved ONNX: {os.path.basename(onnx_path)}")

                # Send final metrics
                log_queue.put({"type": "metrics", "data": filtered_metrics})

            except Exception as e:
                logger.error(f"Training error: {str(e)}", exc_info=True)
                log_queue.put({"type": "error", "msg": str(e)})

        # Start training in a separate thread
        training_thread = threading.Thread(target=train_function)
        training_thread.start()

        # 8) Define generator for streaming response
        def generate():
            while True:
                msg = log_queue.get()
                yield json.dumps(msg) + "\n"
                if msg["type"] in ["metrics", "error"]:
                    break

        return StreamingResponse(generate(), media_type="application/json")

    except Exception as e:
        logger.error(f"Setup error: {str(e)}", exc_info=True)
        return StreamingResponse(
            iter([json.dumps({"type": "error", "msg": str(e)}) + "\n"]),
            media_type="application/json"
        )

# ── /api/save-model ─────────────────────────────────────────────────────────────
@app.post("/api/save-model")
async def save_endpoint():
    global last_model, last_tokenizer, last_metrics, last_train_filename
    logger.info(f"save_endpoint: last_model={last_model is not None}, last_metrics={last_metrics is not None}, last_train_filename={last_train_filename}")
    
    if not last_model or not last_metrics or not last_train_filename:
        logger.error("save_endpoint: Missing required global variables")
        return {"success": False, "error": "Call /api/train first and ensure training completed successfully"}
    
    try:
        date_str = datetime.now().strftime("%d-%m-%Y")
        stem = os.path.splitext(os.path.basename(last_train_filename))[0]
        first_word = stem.split("_")[0] if "_" in stem else stem
        onnx_name = f"{MODEL_NAME}_{date_str}_{first_word}.onnx"
        meta_name = onnx_name.replace(".onnx", "_metadata.json")
        logger.info(f"save_endpoint: Saving model as {onnx_name}")
        
        onnx_path = export_to_onnx(
            last_model,
            last_tokenizer,
            RESULTS_DIR,
            filename=onnx_name
        )
        logger.info(f"save_endpoint: Model saved successfully to {onnx_path}")
        return {
            "success": True,
            "files": [os.path.basename(onnx_path), meta_name]
        }
    except Exception as e:
        logger.error(f"save_endpoint: Failed to save model: {str(e)}", exc_info=True)
        return {"success": False, "error": f"Failed to save model: {str(e)}"}
@app.get("/api/download/{filename}")
async def download_file(filename: str):
    file_path = os.path.join(RESULTS_DIR, filename)
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    # filename= ensures the browser sees a download dialog
    return FileResponse(
        path=file_path,
        media_type="application/octet-stream",
        filename=filename
    )
# ── Entrypoint ─────────────────────────────────────────────────────────────────
if __name__=="__main__":
    uvicorn.run("main:app",host="0.0.0.0",port=8001,reload=True)