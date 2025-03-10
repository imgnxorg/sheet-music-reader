const createState = (initial) => {
  const [getState, setState] = useState(initial);
  const listeners = new Set();

  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const notifyListeners = () => {
    const currentState = getState();
    listeners.forEach((listener) => listener(currentState));
  };

  const wrappedSetState = (update) => {
    setState((prev) => {
      const nextState = typeof update === "function" ? update(prev) : update;
      notifyListeners(); // Notify listeners after state is updated
      return nextState;
    });
  };

  return [getState, wrappedSetState, subscribe];
};

// Usage
const [getState, setState, subscribe] = createState(0);

// Subscribe to changes
const unsubscribe = subscribe((newState) => {
  console.log("State updated to:", newState);
});

// Update state
setState(10); // Logs: State updated to: 10
unsubscribe(); // Removes the listener
setState(20); // No output
