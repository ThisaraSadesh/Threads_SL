'use client';

import { useState, useRef } from 'react';

export default function SimpleMentionBox() {
  const [text, setText] = useState(''); // what’s typed in the box
  const [showPopup, setShowPopup] = useState(false); // is popup open?
  const [query, setQuery] = useState(''); // what comes after @ (e.g. “ali”)
  const [cursorPos, setCursorPos] = useState(0); // where the cursor is
  const textareaRef = useRef<HTMLTextAreaElement>(null); // to control the box

  // Fake user list
  const users = [
    { name: 'Alice', username: 'alice' },
    { name: 'Bob', username: 'bob' },
    { name: 'Carol', username: 'carol' },
  ];

  const filteredUsers = users.filter(u =>
    u.username.includes(query.toLowerCase())
  );

  // When user types
  const handleChange = (e: any) => {
    const newText = e.target.value;
    const cursorPosition = e.target.selectionStart; // ← Where is the blinking cursor?

    setText(newText);

    // Did they just type "@"?
    if (newText[cursorPosition - 1] === '@') {
      setShowPopup(true);
      setQuery(''); // reset search
      setCursorPos(cursorPosition); // remember where @ was typed
    }
    // Are they typing after "@"?
    else if (showPopup) {
      // Find the last "@" before cursor
      const lastAt = newText.lastIndexOf('@', cursorPosition - 1);
      if (lastAt !== -1) {
        const currentQuery = newText.slice(lastAt + 1, cursorPosition);
        // If no space in query, keep popup open
        if (!currentQuery.includes(' ')) {
          setQuery(currentQuery);
          return;
        }
      }
      // Otherwise, close popup
      setShowPopup(false);
    }
  };

  // When user picks someone
  const pickUser = (username: string) => {
    // Cut text before @, insert @username, then add rest
    const before = text.slice(0, cursorPos - query.length - 1);
    const after = text.slice(cursorPos);
    const newText = `${before}@${username} ${after}`;

    setText(newText);
    setShowPopup(false);

    // Put cursor AFTER the inserted name
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = cursorPos - query.length - 1 + username.length + 2; // +2 for '@' and space
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  return (
    <div style={{ position: 'relative', width: '400px' }}>
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleChange}
        placeholder="Type something with @"
        rows={5}
        style={{
          width: '100%',
          padding: '10px',
          fontSize: '16px',
          border: '1px solid #ccc',
          borderRadius: '6px',
        }}
      />

      {/* POPUP */}
      {showPopup && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '6px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            zIndex: 10,
            width: '100%',
            maxHeight: '150px',
            overflowY: 'auto',
          }}
          onClick={(e) => e.stopPropagation()} // don’t close when clicking inside
        >
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div
                key={user.username}
                onClick={() => pickUser(user.username)}
                onMouseDown={(e) => e.preventDefault()} // important!
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #eee',
                }}
              >
                @{user.username} - {user.name}
              </div>
            ))
          ) : (
            <div style={{ padding: '8px 12px', color: '#999' }}>
              No matches
            </div>
          )}
        </div>
      )}
    </div>
  );
}