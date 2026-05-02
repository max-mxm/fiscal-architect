import React from 'react';

interface LiveAnnouncerProps {
  message: string;
}

export const LiveAnnouncer: React.FC<LiveAnnouncerProps> = ({ message }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
};
