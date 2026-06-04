import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, CheckCircle2, AlertCircle, X, Loader2, FileUp } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import ProgressBar from './ProgressBar';
import { useFilePicker } from '../../hooks/useFilePicker';
import { useWorkspace } from '../../stores/useWorkspace';

const STEPS = { SELECT: 'select', IMPORTING: 'importing', DONE: 'done' };

export default function ImportModal({ isOpen, onClose }) {
  const [step, setStep] = useState(STEPS.SELECT);
  const [progress, setProgress] = useState({ current: 0, total: 0, phase: '' });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const { pickDirectory } = useFilePicker();
  const importingRef = useRef(false);

  const reset = useCallback(() => {
    setStep(STEPS.SELECT);
    setProgress({ current: 0, total: 0, phase: '' });
    setResult(null);
    setError(null);
    importingRef.current = false;
  }, []);

  const handleClose = useCallback(() => {
    if (step === STEPS.IMPORTING) return;
    reset();
    onClose?.();
  }, [step, reset, onClose]);

  const handleSelectFolder = useCallback(async () => {
    const state = useWorkspace.getState();
    if (!state.workspace?._id) {
      setError('No workspace loaded. Please open a workspace first.');
      return;
    }

    setStep(STEPS.IMPORTING);
    setProgress({ current: 0, total: 0, phase: 'Opening folder picker...' });
    setError(null);
    importingRef.current = true;

    try {
      const entries = await pickDirectory();
      if (!entries || entries.length === 0) {
        setError('No folder selected or folder is empty.');
        setStep(STEPS.SELECT);
        importingRef.current = false;
        return;
      }

      const total = entries.length;
      setProgress({ current: 0, total, phase: 'Reading files...' });

      const batch = [];
      let readErrors = 0;
      let totalImported = 0;
      let batchCount = 0;

      for (let i = 0; i < total; i++) {
        if (!importingRef.current) return;

        const entry = entries[i];
        try {
          const content = await entry.raw.text();
          batch.push({ path: entry.path, content });
        } catch {
          readErrors++;
        }

        setProgress({
          current: i + 1,
          total,
          phase: 'Reading files...' + (readErrors > 0 ? ' (' + readErrors + ' skipped)' : ''),
        });

        if (batch.length >= 50 || i === total - 1) {
          if (batch.length === 0) continue;
          batchCount++;
          setProgress({
            current: i + 1,
            total,
            phase: 'Uploading batch ' + batchCount + '...',
          });

          const result = await state.importFiles(batch);
          if (result) totalImported += result.imported;
          batch.length = 0;
        }
      }

      await state.fetchWorkspace(state.workspace._id);
      state.setActiveSidebarView('explorer');

      setResult({ imported: totalImported, total, readErrors });
      setStep(STEPS.DONE);
    } catch (err) {
      setError(err.message || 'Import failed');
      setStep(STEPS.SELECT);
    } finally {
      importingRef.current = false;
    }
  }, [pickDirectory]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        step === STEPS.SELECT ? 'Import Files' :
        step === STEPS.IMPORTING ? 'Importing...' :
        'Import Complete'
      }
      description={
        step === STEPS.SELECT ? 'Select a folder from your computer to import into your workspace.' :
        step === STEPS.IMPORTING ? progress.current + ' / ' + progress.total + ' files processed' :
        result ? result.imported + ' files imported successfully' : ''
      }
      size="md"
      showClose={step !== STEPS.IMPORTING}
    >
      <AnimatePresence mode="wait">
        {step === STEPS.SELECT && (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center gap-5 py-6"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="w-full border-2 border-dashed border-[rgba(255,255,255,0.08)] rounded-2xl p-8 flex flex-col items-center gap-4 cursor-pointer hover:bg-[rgba(255,255,255,0.02)] transition-colors"
              onClick={handleSelectFolder}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className="w-16 h-16 rounded-2xl bg-[rgba(255,255,255,0.04)] flex items-center justify-center"
              >
                <FolderOpen size={28} className="text-[rgba(255,255,255,0.3)]" />
              </motion.div>
              <div className="text-center">
                <p className="text-[15px] font-medium text-[rgba(255,255,255,0.6)]">
                  Choose a folder
                </p>
                <p className="text-[12px] text-[rgba(255,255,255,0.2)] mt-1">
                  Your files will be uploaded to the workspace with their folder structure preserved
                </p>
              </div>
            </motion.div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-[12px] text-[#ff453a] bg-[rgba(255,69,58,0.08)] px-4 py-2 rounded-lg w-full"
              >
                <AlertCircle size={14} />
                {error}
              </motion.div>
            )}

            <Button onClick={handleSelectFolder} icon={FolderOpen} size="lg" className="w-full">
              Select Folder
            </Button>
          </motion.div>
        )}

        {step === STEPS.IMPORTING && (
          <motion.div
            key="importing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-5 py-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[rgba(255,255,255,0.5)]">
                  {progress.phase}
                </span>
                <span className="text-[rgba(255,255,255,0.3)] tabular-nums">
                  {progress.current} / {progress.total}
                </span>
              </div>
              <ProgressBar
                value={progress.current}
                max={progress.total}
                size="md"
                variant="accent"
              />
            </div>

            <div className="flex items-center justify-center gap-2 text-[12px] text-[rgba(255,255,255,0.25)]">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 size={14} />
              </motion.div>
              Please wait while your files are being processed...
            </div>
          </motion.div>
        )}

        {step === STEPS.DONE && result && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-5 py-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="mx-auto w-16 h-16 rounded-full bg-[rgba(48,209,88,0.1)] flex items-center justify-center"
            >
              <CheckCircle2 size={32} className="text-[#30d158]" />
            </motion.div>

            <div className="grid grid-cols-2 gap-3">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-[rgba(255,255,255,0.03)] rounded-xl p-4 text-center"
              >
                <p className="text-[24px] font-semibold text-[#30d158]">{result.imported}</p>
                <p className="text-[11px] text-[rgba(255,255,255,0.3)] mt-1">Imported</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-[rgba(255,255,255,0.03)] rounded-xl p-4 text-center"
              >
                <p className="text-[24px] font-semibold text-[rgba(255,255,255,0.4)]">{result.readErrors}</p>
                <p className="text-[11px] text-[rgba(255,255,255,0.3)] mt-1">Skipped</p>
              </motion.div>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-[12px] text-[rgba(255,255,255,0.25)] text-center"
            >
              Files have been added to your workspace with their folder structure preserved.
            </motion.p>

            <Button
              onClick={() => { reset(); onClose?.(); }}
              size="lg"
              className="w-full mt-2"
            >
              Done
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
