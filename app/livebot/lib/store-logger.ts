import { create } from "zustand";

interface StreamingLog {
  date: Date;
  type: 'user' | 'system' | 'log' | 'tool';
  message: unknown;
  count?: number;
}

interface StoreLoggerState {
  maxLogs: number;
  logs: StreamingLog[];
  log: (streamingLog: StreamingLog) => void;
  clearLogs: () => void;
  setMaxLogs: (n: number) => void;
}

function sanitize(value: unknown): unknown {
  if (value instanceof Set) {
    return Array.from(value).map(sanitize);
  }
  if (Array.isArray(value)) {
    return value.map(sanitize);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, sanitize(v)])
    );
  }
  return value;
}

export const useLoggerStore = create<StoreLoggerState>((set, get) => ({
  maxLogs: 500,
  logs: [],
  log: (streamingLog: StreamingLog) => {
    set((state) => {
      const { date, type, message } = sanitize(streamingLog) as StreamingLog;
      const prevLog = state.logs.at(-1);
      
      // Only combine consecutive messages of the same type and content
      if (
        prevLog && 
        prevLog.type === type && 
        JSON.stringify(prevLog.message) === JSON.stringify(message)
      ) {
        return {
          logs: [
            ...state.logs.slice(0, -1),
            {
              date,
              type,
              message,
              count: (prevLog.count || 1) + 1,
            },
          ],
        };
      }

      return {
        logs: [
          ...state.logs.slice(-(get().maxLogs - 1)),
          { date, type, message },
        ],
      };
    });
  },
  clearLogs: () => set({ logs: [] }),
  setMaxLogs: (n: number) => set({ maxLogs: n }),
}));