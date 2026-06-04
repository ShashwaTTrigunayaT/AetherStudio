import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTerminal } from '../../stores/useTerminal';
import {
  Search,
  X,
  ChevronUp,
  ChevronDown,
  CaseSensitive,
  WholeWord,
  Regex,
} from 'lucide-react';

export default function TerminalSearch({ searchAddon }) {
  const inputRef = useRef(null);
  const {
    searchVisible,
    searchQuery,
    searchResultIndex,
    searchResultCount,
    setSearchQuery,
    setSearchResultIndex,
    setSearchResultCount,
    toggleSearch,
  } = useTerminal();

  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);

  // Focus input when search opens
  useEffect(() => {
    if (searchVisible && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [searchVisible]);

  // Perform search when query or options change
  useEffect(() => {
    if (!searchAddon || !searchVisible) return;

    if (!searchQuery) {
      setSearchResultCount(0);
      setSearchResultIndex(0);
      return;
    }

    const resultIndex = searchAddon.findNext(searchQuery, {
      caseSensitive,
      wholeWord,
      regex: useRegex,
    });

    if (resultIndex) {
      setSearchResultIndex(1);
      setSearchResultCount(-1);
    } else {
      setSearchResultIndex(0);
      setSearchResultCount(0);
    }
  }, [searchQuery, caseSensitive, wholeWord, useRegex, searchVisible]);

  const handleFindNext = useCallback(() => {
    if (!searchAddon || !searchQuery) return;
    const result = searchAddon.findNext(searchQuery, {
      caseSensitive,
      wholeWord,
      regex: useRegex,
    });
    if (result) {
      setSearchResultIndex((prev) => prev + 1);
    }
  }, [searchAddon, searchQuery, caseSensitive, wholeWord, useRegex]);

  const handleFindPrevious = useCallback(() => {
    if (!searchAddon || !searchQuery) return;
    const result = searchAddon.findPrevious(searchQuery, {
      caseSensitive,
      wholeWord,
      regex: useRegex,
    });
    if (result && searchResultIndex > 1) {
      setSearchResultIndex((prev) => prev - 1);
    }
  }, [searchAddon, searchQuery, caseSensitive, wholeWord, useRegex, searchResultIndex]);

  const handleClose = useCallback(() => {
    toggleSearch();
    if (searchAddon) {
      searchAddon.findNext('', { caseSensitive: false, wholeWord: false, regex: false });
    }
  }, [searchAddon, toggleSearch]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          handleFindPrevious();
        } else {
          handleFindNext();
        }
      }
      if (e.key === 'Escape') {
        handleClose();
      }
    },
    [handleFindNext, handleFindPrevious, handleClose]
  );

  return (
    <AnimatePresence>
      {searchVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.97 }}
          transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
          className="absolute top-0 right-0 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-lg shadow-lg"
          style={{
            margin: '8px 10px',
            background: 'rgba(8,8,16,0.96)',
            backdropFilter: 'blur(24px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
            border: '1px solid rgba(0,240,255,0.12)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.8), 0 0 30px rgba(0,240,255,0.10), 0 0 60px rgba(0,240,255,0.04), inset 0 1px 0 rgba(0,240,255,0.08)',
          }}
        >
          {/* Search icon — cyan */}
          <Search size={11} className="text-[rgba(0,240,255,0.4)] flex-shrink-0" strokeWidth={2} />

          {/* Input — cyberpunk */}
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Find"
            className="w-[180px] rounded-sm px-2 py-[2px] text-[12px] text-[#f0f0f0] placeholder-[rgba(200,200,220,0.2)] outline-none transition-colors"
            style={{
              backgroundColor: 'rgba(0,240,255,0.04)',
              border: '1px solid rgba(0,240,255,0.15)',
              boxShadow: 'inset 0 0 12px rgba(0,240,255,0.06), 0 0 20px rgba(0,240,255,0.04)',
            }}
          />

          {/* Result count */}
          {searchQuery && (
            <motion.span
              key={searchQuery}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.1 }}
              className="text-[11px] text-[rgba(128,128,176,0.35)] flex-shrink-0 min-w-[24px] text-center font-mono"
            >
              {searchResultCount === 0
                ? '0/0'
                : `${searchResultIndex}${searchResultCount > 0 ? `/${searchResultCount}` : '+'}`}
            </motion.span>
          )}

          {/* Navigate buttons */}
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(0,240,255,0.06)' }}
            whileTap={{ scale: 0.9 }}
            onClick={handleFindPrevious}
            className="p-0.5 rounded-sm transition-colors disabled:opacity-30"
            disabled={!searchQuery}
            title="Previous match (Shift+Enter)"
          >
            <ChevronUp size={12} className="text-[rgba(128,128,176,0.4)]" strokeWidth={2} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(0,240,255,0.06)' }}
            whileTap={{ scale: 0.9 }}
            onClick={handleFindNext}
            className="p-0.5 rounded-sm transition-colors disabled:opacity-30"
            disabled={!searchQuery}
            title="Next match (Enter)"
          >
            <ChevronDown size={12} className="text-[rgba(128,128,176,0.4)]" strokeWidth={2} />
          </motion.button>

          {/* Divider */}
          <div className="w-px h-3.5 bg-[rgba(0,240,255,0.08)] mx-0.5" />

          {/* Case sensitive — cyan when active */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setCaseSensitive((p) => !p)}
            className={`p-0.5 rounded-sm transition-colors ${
              caseSensitive
                ? 'text-[#00f0ff]'
                : 'hover:bg-[rgba(0,240,255,0.06)] text-[rgba(128,128,176,0.35)]'
            }`}
            title="Match Case"
          >
            <motion.div
              animate={caseSensitive ? { scale: [1, 1.2, 1] } : { scale: 1 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <CaseSensitive size={12} strokeWidth={2} />
            </motion.div>
          </motion.button>

          {/* Whole word */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setWholeWord((p) => !p)}
            className={`p-0.5 rounded-sm transition-colors ${
              wholeWord
                ? 'text-[#00f0ff]'
                : 'hover:bg-[rgba(0,240,255,0.06)] text-[rgba(128,128,176,0.35)]'
            }`}
            title="Match Whole Word"
          >
            <motion.div
              animate={wholeWord ? { scale: [1, 1.2, 1] } : { scale: 1 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <WholeWord size={12} strokeWidth={2} />
            </motion.div>
          </motion.button>

          {/* Regex */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setUseRegex((p) => !p)}
            className={`p-0.5 rounded-sm transition-colors ${
              useRegex
                ? 'text-[#00f0ff]'
                : 'hover:bg-[rgba(0,240,255,0.06)] text-[rgba(128,128,176,0.35)]'
            }`}
            title="Use Regular Expression"
          >
            <motion.div
              animate={useRegex ? { scale: [1, 1.2, 1] } : { scale: 1 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <Regex size={12} strokeWidth={2} />
            </motion.div>
          </motion.button>

          {/* Close */}
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,45,149,0.08)' }}
            whileTap={{ scale: 0.9 }}
            onClick={handleClose}
            className="p-0.5 rounded-sm transition-colors ml-0.5 text-[rgba(128,128,176,0.35)] hover:text-[#ff2d95]"
            title="Close (Escape)"
          >
            <X size={12} strokeWidth={2} />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
