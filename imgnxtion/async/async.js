const useState = (initial) => {
    let state = initial; // Immutable state
    const updateQueue = []; // Queue for batching updates
    let isFlushing = false; // Prevent re-entrant flushes

    const setState = (next) => {
        // Add the update to the queue
        updateQueue.push(next);

        // Schedule a flush if not already in progress
        if (!isFlushing) {
            isFlushing = true;
            Promise.resolve().then(() => flushQueue());
        }
    };

    const flushQueue = () => {
        let newState = state; // Start with current state

        // Process all updates in the queue
        while (updateQueue.length > 0) {
            const update = updateQueue.shift();
            if (typeof update === "function") {
                newState = update(newState); // Functional update
            } else {
                newState = update; // Direct value update
            }
        }

        // Only update state if it has changed
        if (newState !== state) {
            state = newState; // Update the state immutably
        }

        isFlushing = false; // Reset flushing status
    };

    return [
        () => state, // Getter for the current state
        setState, // Setter for updating the state
    ];
};

// Example Usage
const [getState, setState] = useState(0);

// Log the initial state
console.log("Initial state:", getState());

// Update state
setState((prev) => prev + 1);
setState((prev) => prev * 2);
setState(100);

// Allow the queue to flush
setTimeout(() => {
    console.log("Final state:", getState()); // Output: Final state: 100
}, 0);
