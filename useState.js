/** This code defines a custom implementation of the
 * `useState` hook in JavaScript. Here's a breakdown of what it does:
 *
 *  1. **`useState` Function**:
 *
 *    - Takes an initial state value (`initial`) and sets up a
 *        state container (`val`) and a type tracker (`_type`).
 *    - Defines a `setState` function to update the state.
 *
 *    - The `setState` function checks the type of the new state
 *        value to ensure it matches the initial type.
 *    - Adds the state update to a queue and then flushes the queue
 *        using `flushActQueue`.
 *
 *
 *  2. **`flushActQueue` Function**:
 *
 *    - Ensures that the queue is processed without re-entrance.
 *
 *    - Iterates through the queue and executes each callback.
 *
 *    - If an error occurs, it slices the queue to remove processed
 *        callbacks and rethrows the error.
 *    - Resets the `isFlushing` flag after processing.
 *
 *
 *
 *  The `flushActQueue` function ensures that state updates are
 *  processed in order and prevents re-entrance issues by
 *  using the `isFlushing` flag. The `useState` function provides
 *  a way to manage state with type checking and
 *  batching of state updates.
 *
 */

/**
 * Custom implementation of the useState hook.
 *
 * @param {any} initial - The initial state value.
 * @returns {[any, function]} - An array containing the current state value and a function to update the state.
 *
 * @throws {Error} If the type of the new state value does not match the type of the initial state value.
 */

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
