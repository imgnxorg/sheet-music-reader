const useState = (initial) => {
    let state = initial; // Immutable state
    const listeners = new Set(); // List of subscribers
    const updateQueue = []; // Queue to hold pending updates
    let isFlushing = false; // Prevent re-entrant flushes

    const setState = (next) => {
        // Add update to the queue
        updateQueue.push(next);

        // Schedule a flush if not already in progress
        if (!isFlushing) {
            isFlushing = true;
            Promise.resolve().then(() => flushQueue());
        }
    };

    const flushQueue = () => {
        let newState = state; // Start with the current state

        // Apply all updates in the queue
        while (updateQueue.length > 0) {
            const update = updateQueue.shift();
            if (typeof update === "function") {
                newState = update(newState); // Functional update
            } else {
                newState = update; // Direct value update
            }
        }

        // Update state immutably
        if (newState !== state) {
            state = newState;

            // Notify listeners of the new state
            listeners.forEach((listener) => listener(state));
        }

        // Mark flush as complete
        isFlushing = false;
    };

    const subscribe = (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener); // Unsubscribe function
    };

    const destroy = () => {
        listeners.clear(); // Clear all listeners
        updateQueue.length = 0; // Clear the update queue
        console.log("State destroyed");
    };

    return [
        () => state, // Getter for state
        setState, // Setter for state
        subscribe, // Subscribe to state changes
        destroy, // Destroy mechanism
    ];
};

// Example Usage
const [getState, setState, subscribe, destroy] = useState(0);

// Subscribe to state changes
const unsubscribe = subscribe((newState) => {
    console.log("State updated to:", newState);
});

// Set state updates
console.log("Initial state:", getState()); // Initial state: 0
setState((prev) => prev + 1);
setState((prev) => prev * 2); // Updates are batched
setState(100);

// Allow the queue to flush (simulated by the event loop)
setTimeout(() => {
    console.log("Final state:", getState()); // Final state: 100

    // Clean up
    unsubscribe();
    destroy();
}, 0);
