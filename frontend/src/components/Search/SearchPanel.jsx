import React, { useRef, useEffect, useState } from 'react';
import {
  Search, X, File, Replace, ReplaceAll, FileSearch,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkspace } from '../../stores/useWorkspace';

export default function SearchPanel() {
  const {
    searchQuery, setSearchQuery, searchResults, isSearching,
    performSearch, clearSearch, replaceText, setReplaceText,
    openFile,
  } = useWorkspace();
  const inputRef = useRef(null);
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = (e) => {
    e?.preventDefault();
    performSearch(searchQuery);
  };

  const handleClear = () => {
    clearSearch();
    inputRef.current?.focus();
  };

  const handleFileClick = (file) => {
    openFile(file);
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Ambient light at top */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[1px] pointer-events-none z-10"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
          boxShadow: '0 0 30px rgba(255,255,255,0.15), 0 0 60px rgba(255,255,255,0.05)',
        }}
      />

      {/* Header */}
      <div className="flex-shrink-0 relative z-10">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(12,12,24,0.95) 0%, rgba(0,0,0,0.95) 100%)',
          }}
        />
        <div className="flex items-center gap-2 px-3 py-[10px] relative z-10">
          {/* Status dot */}
          <div className="relative flex-shrink-0">
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-[5px] h-[5px] rounded-full"
              style={{ backgroundColor: '#4a9eff' }}
            />
            <div
              className="absolute inset-0 blur-[6px] rounded-full"
              style={{ backgroundColor: '#4a9eff', opacity: 0.6 }}
            />
            <div
              className="absolute -inset-[5px] rounded-full blur-[3px] opacity-40"
              style={{ border: '1.5px solid rgba(255,255,255,0.3)' }}
            />
          </div>

          <Search size={11} className="text-[rgba(255,255,255,0.3)]" />
          <span className="text-[10px] font-semibold uppercase tracking-[1.2px] text-[rgba(255,255,255,0.25)]">
            Search
          </span>

          {/* Separator */}
          <span className="text-[8px] text-[rgba(255,255,255,0.2)] font-mono">◆</span>

          {/* Result count badge */}
          {searchResults.length > 0 && (
            <span
              className="ml-auto text-[9px] font-mono px-1.5 py-[1px] rounded-full"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.4)',
              }}
            >
              {searchResults.length}
            </span>
          )}
        </div>

        <div className="mx-3 h-px relative overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), rgba(255,255,255,0.06), transparent)',
            }}
          />
        </div>
      </div>

      {/* Search inputs */}
      <div className="px-3 pt-3 pb-2 space-y-2 relative z-10">
        <form onSubmit={handleSearch}>
          <div className="relative group">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.2)] group-focus-within:text-[rgba(255,255,255,0.5)] transition-colors" strokeWidth={1.5} />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="w-full rounded-lg pl-8 pr-8 py-1.5 text-[12px] text-[rgba(255,255,255,0.7)] placeholder:text-[rgba(255,255,255,0.15)] transition-all outline-none"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            />
            {searchQuery && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={handleClear}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors"
                style={{ color: 'rgba(255,255,255,0.2)' }}
                whileHover={{ color: 'rgba(255,255,255,0.6)', backgroundColor: 'rgba(255,255,255,0.08)' }}
              >
                <X size={11} strokeWidth={1.5} />
              </motion.button>
            )}
          </div>
        </form>

        {/* Replace input */}
        <div className="relative group">
          <Replace size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.2)] group-focus-within:text-[rgba(255,255,255,0.5)] transition-colors" strokeWidth={1.5} />
          <input
            type="text"
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}              placeholder="Replace"
              className="w-full rounded-lg pl-8 pr-8 py-1.5 text-[12px] text-[rgba(255,255,255,0.7)] placeholder:text-[rgba(255,255,255,0.15)] transition-all outline-none"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
          />
          <motion.button
            whileHover={{ scale: 1.1, color: 'rgba(255,255,255,0.6)', backgroundColor: 'rgba(255,255,255,0.08)' }}
            onClick={handleSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors"
            style={{ color: 'rgba(255,255,255,0.2)' }}
          >
            <ReplaceAll size={11} strokeWidth={1.5} />
          </motion.button>
        </div>

        {/* Search options */}
        <div className="flex items-center gap-3 text-[10px]" style={{ color: 'rgba(255,255,255,0.15)' }}>
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-[rgba(255,255,255,0.35)] transition-colors duration-150">
            <input type="checkbox" checked={matchCase} onChange={(e) => setMatchCase(e.target.checked)} className="w-3 h-3 rounded transition-all" style={{ accentColor: '#4a9eff' }} />
            <span>Match case</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-[rgba(255,255,255,0.35)] transition-colors duration-150">
            <input type="checkbox" checked={wholeWord} onChange={(e) => setWholeWord(e.target.checked)} className="w-3 h-3 rounded transition-all" style={{ accentColor: '#4a9eff' }} />
            <span>Whole word</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-[rgba(255,255,255,0.35)] transition-colors duration-150">
            <input type="checkbox" checked={useRegex} onChange={(e) => setUseRegex(e.target.checked)} className="w-3 h-3 rounded transition-all" style={{ accentColor: '#4a9eff' }} />
            <span>Regex</span>
          </label>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto relative z-10">
        <AnimatePresence mode="wait">
          {isSearching && (
            <motion.div
              key="searching"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-8"
            >
              <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(255,255,255,0.1)', borderTopColor: '#4a9eff' }} />
            </motion.div>
          )}

          {!isSearching && searchQuery && searchResults.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center py-8 px-4"
            >
              <FileSearch size={22} className="mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.08)' }} strokeWidth={1.5} />
              <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                No results for "{searchQuery}"
              </p>
            </motion.div>
          )}

          {!isSearching && searchResults.length > 0 && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-1"
            >
              {searchResults.map((result, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.02 }}
                >
                  {/* File header */}
                  <motion.div
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
                    onClick={() => handleFileClick(result.file)}
                    className="flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-all duration-100 group"
                  >
                    <File size={11} className="flex-shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }} strokeWidth={1.5} />
                    <span className="text-[12px] flex-1 truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {result.file?.name || result.path}
                    </span>
                    <span
                      className="text-[9px] font-mono px-1 py-[1px] rounded"
                      style={{
                        color: 'rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.04)',
                      }}
                    >
                      {result.matches?.length || 0}
                    </span>
                  </motion.div>

                  {/* Line matches */}
                  {(result.matches || []).slice(0, 10).map((match, mIdx) => (
                    <motion.div
                      key={mIdx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: mIdx * 0.01 }}
                      whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                      className="flex items-center gap-2 px-3 py-0.5 pl-9 cursor-pointer transition-all duration-100 group"
                    >
                      <span className="text-[9px] tabular-nums w-6 text-right flex-shrink-0" style={{ color: 'rgba(255,255,255,0.15)' }}>
                        {match.line}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-mono truncate block" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          {match.content}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
