import React, { useState, useRef, useEffect } from 'react';

export default function RenameInput({ initialName, onSubmit, onCancel }) {
  const [name, setName] = useState(initialName);
  const inputRef = useRef(null);

  useEffect(() => {
    const dotIdx = initialName.lastIndexOf('.');
    if (dotIdx > 0) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(0, dotIdx);
          inputRef.current.focus();
        }
      }, 0);
    } else {
      setTimeout(() => inputRef.current?.select(), 0);
    }
  }, [initialName]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim() && name.trim() !== initialName) {
      onSubmit(name.trim());
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex-1 ml-1.5">
      <input
        ref={inputRef}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={handleSubmit}
        onKeyDown={handleKeyDown}
        className="w-full bg-[rgba(0,240,255,0.06)] border border-[rgba(0,240,255,0.3)] rounded px-1.5 py-[2px] text-[13px] text-[rgba(200,200,220,0.8)] placeholder:text-[rgba(200,200,220,0.2)] focus:outline-none focus:border-[rgba(0,240,255,0.5)] focus:shadow-[0_0_12px_rgba(0,240,255,0.2)] transition-all duration-100"
        style={{ fontFamily: 'inherit' }}
        autoFocus
      />
    </form>
  );
}
