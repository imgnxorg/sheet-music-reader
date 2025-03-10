// ==========================================================================
// tab-focus.js
// Detect keyboard tabbing
// ==========================================================================
// Credit: Sam Potts https://gist.github.com/sampotts
(function () {
  var className = "tab-focus";
  // Remove class on blur
  document.addEventListener("focusout", function (event) {
    event.target.classList.remove(className);
    // Delay the adding of classname until the focus has changed
    // This event fires before the focusin event
    window.setTimeout(function () {
      // Debounce the animation.
    }, 899);
    window.setTimeout(function () {
      document.activeElement.classList.add(className);
      centerElement(document.activeElement);
    }, 0);
  });

  // Add classname to tabbed elements
  document.addEventListener("keydown", function (event) {
    if (event.keyCode !== 9) {
      return;
    }

    // Delay the adding of classname until the focus has changed
    // This event fires before the focusin event
    window.setTimeout(function () {
      document.activeElement.classList.add(className);
      centerElement(document.activeElement);
    }, 0);
  });

  function centerElement(el) {
    el.focus();
    el.scrollIntoView({
      inline: "center",
    });
  }

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

      try {
        // Update state immutably
        if (newState !== state) {
          state = newState;

          // Notify listeners of the new state
          listeners.forEach((listener) => listener(state));
        }
      } catch (error) {
        console.error("Error updating state:", error);
        throw error;
      } finally {
        // Mark flush as complete
        isFlushing = false;
      }
    };

    const subscribe = (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener); // Unsubscribe function
    };

    const destroy = () => {
      subscribe();
      listeners.clear(); // Clear all listeners
      updateQueue.length = 0; // Clear the update queue
      console.log("State destroyed");
    };

    return [
      subscribe, // Getter for state
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
    destroy();
  }, 0);

  const [
    activePageIndex,
    setActivePageIndex,
    subscribeActivePageIndex,
    destroyActivePageIndex,
  ] = useState(0);
  // Subscribe to state changes
  const unsubscribeActivePageIndex = subscribeActivePageIndex((newState) => {
    console.log("ActivePageIndex updated to:", newState);
  });

  const [momentum, setMomentum, subscribeMomentum, destroyMomentum] =
    useState(0);

  const [bpm, setBpm, subscribeBpm, destroyBpm] = useState(100);

  const [
    tabbableElements,
    setTabbableElements,
    subscribeTabbableElements,
    destroyTabbableElements,
  ] = useState([]);

  const handleChange = (e) => {
    const bpm = e.target.value;
    console.log("BPM", bpm);
    setBpm(bpm);
  };

  const log = (args) => {
    console.log(`${args}`, args[0] ? [...args] : args);
  };

  document.addEventListener("DOMContentLoaded", async () => {
    if (typeof window !== "undefined") {
      chalk = window.chalk;
    }

    const contentTags = document.querySelectorAll("pre > div.content");
    contentTags[0].focus();

    const scrollContainer = document.querySelector("#scroll-container");

    function elementHasPageIndex(el) {
      return el.hasAttribute("data-page-index");
    }

    const mouseoverHandler = _.debounce((target) => {
      console.log(target.dataset.pageIndex, ">=", activePageIndex);
      if (target.dataset.pageIndex >= activePageIndex) {
        target.focus();
      }
    }, 1000);

    const tabbableElements = tabbable();
    setTabbableElements(tabbableElements);

    contentTags.forEach((el, index) => {
      // console.log("Content tag:", el, index);
      if (elementHasPageIndex(el)) {
        if (el.tabIndex === 0) {
          // TODO: Nothing. It's unreachable.
          // It's either -1 or 0. Docs:
          // https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex
          // console.log("Setting page index:", el, index);
          el.dataset.pageIndex = index + 1; // This is how you define it without React...
          el.addEventListener("mouseover", (e) => mouseoverHandler(e.target));
        }
      }
    });

    // Future Gist

    console.log("tabbableElements", tabbableElements);

    async function tabEventHandler(shiftKey) {
      // Create a "Shift+Tab" keyboard event
      const opts = {
        key: "Tab", // Represents the key pressed
        code: "Tab", // Represents the physical key location
        keyCode: 9, // Deprecated but still widely used
        shiftKey, // Indicates the "Shift" key is held
        bubbles: true, // Event propagates up the DOM
        cancelable: true, // Allows default behavior to be prevented
      };

      const shiftTabEvent = new KeyboardEvent("keydown", opts);

      // Target an element to dispatch the event
      const targetElement = document.activeElement || document.body;

      console.log(`Simulating ${shiftKey ? "Shift+" : ""}Tab event`, opts);

      console.log(activePageIndex);

      // Dispatch the event
      targetElement.dispatchEvent(shiftTabEvent);
    }

    window.onkeypress = async (e) => {
      // e.stopImmediatePropagation();
      // e.preventDefault();
      // e.stopPropagation();

      if (e.shiftKey && e.key === "Shift") {
        return 0;
      }

      console.log(`Pressed: %c${e.key}`, "color: greenyellow");
      console.log(e);

      if (e.key === "b" && !!e.metaKey) {
        console.log("Click..");
        document.querySelector("#bpm-btn").click();
      }
      // const activePageIndex = await getActivePageIndex();
      let expected;
      if ([" ", "Enter", "Tab"].includes(e.key)) {
        if (e.shiftKey) {
          expected =
            (activePageIndex - 1 + contentTags.length) % contentTags.length;
          setActivePageIndex(expected);
        } else {
          expected =
            (activePageIndex + 1 + contentTags.length) % contentTags.length;
          setActivePageIndex(expected);
        }

        console.log(
          `This should fail because it's called in the same function that tries to set it synchronously. Setting is an asynchronous operation.`,
          `expected: ${expected}`,
          `received (activePageIndex): ${activePageIndex}`,
        );
        e.preventDefault();
        tabEventHandler(e.shiftKey);
        centerElement(contentTags[activePageIndex]);
      }
      //  else {
      //     window.dispatchEvent(e);
      // }
    };

    const scrollYHandler = _.throttle((e, target) => {
      // console.log("Throttled 1");
      target.scrollTop = target.scrollTop + e.deltaY * 10;
    }, 50);

    const scrollXHandler = _.throttle(
      async (e) => {
        const directionX = e.deltaY + e.deltaX > 0 ? 1 : -1,
          nextPageIndex =
            (activePageIndex + directionX + contentTags.length) %
            contentTags.length;
        console.log("Focus in:", contentTags[nextPageIndex]);

        setActivePageIndex(nextPageIndex);
      },
      1000,
      { trailing: false },
    );

    (function resetMomentum() {
      _.debounce(function resetMomentum() {
        console.log("Resetting Momentum...");
        setMomentum(0);
        resetMomentum();
      }, bpm * 300);
    })();

    scrollContainer.addEventListener("wheel", async (e) => {
      let override = false;
      // e.preventDefault();
      // e.stopImmediatePropagation();
      // e.stopPropagation();
      const deltaY = e.deltaY,
        deltaX = e.deltaX,
        target = e.target || contentTags[activePageIndex];

      // console.log("Target:", target);
      // console.log("Diff:", target.scrollHeight - scrollableArea);
      // console.log("Delta: ( x:", deltaX, ", y:", deltaY, ")");
      const delta = deltaX + deltaY;
      console.log("Combined Delta: ", delta);

      setMomentum(momentum + delta);
      console.log("Momentum: ", momentum + delta);

      scrollableArea = target.clientHeight + target.scrollTop;

      if (momentum >= scrollableArea || delta >= scrollableArea) {
        override = true;
      }

      if (!!override) {
        scrollXHandler(e);
      } else if (target.scrollHeight - scrollableArea > 0) {
        scrollYHandler(e, target);
      } else {
        scrollXHandler(e);
      }
    });

    // Select the node that will be observed for mutations

    // Options for the observer (which mutations to observe)
    const config = {
      attributes: true,
      attributeOldValue: true,
      childList: true,
      subtree: true,
      characterData: true,
      characterDataOldValue: true,
    };

    // Callback function to execute when mutations are observed
    const callback = (mutationList, observer) => {
      for (const mutation of mutationList) {
        const target = mutation.target;
        console.log("Mutation target:", mutation.target);
        if (mutation.type === "childList") {
          console.log("A child node has been added or removed.", mutation);
        } else if (mutation.type === "attributes") {
          const index = Number(target.dataset?.pageIndex);
          if (!!index) {
            setActivePageIndex(index);
          }

          console.log(
            `The ${mutation.attributeName} attribute was modified on ${mutation.target}`,
          );
        }
      }
    };

    // Create an observer instance linked to the callback function
    const observer = new MutationObserver(callback);

    // Start observing the target node for configured mutations
    observer.observe(scrollContainer, config);

    // Later, you can stop observing
    // observer.disconnect();

    document.querySelectorAll(".bpm-input").forEach((input) => {
      input.addEventListener("change", handleChange);
    });

    // Maybe needs to be immutable
    let oneMinute = 1000 * 60,
      inTime = Date.now(0),
      sessions = [],
      currentSession = [];

    function measureBpm() {
      if (inTime === 0) {
        inTime = Date.now();
        currentSession.push(inTime);
      } else {
        const now = Date.now();
        currentSession.push(now);
      }
      const taps = currentSession.length,
        outTime = currentSession[taps - 1],
        diffInMs = outTime - inTime,
        factorial = oneMinute / diffInMs,
        bpm = taps * factorial;

      setTimeout(() => {
        const taps = currentSession.length;
        const now = Date.now();
        if (now - currentSession[taps - 1] > 5000) {
          updateBpm(bpm);
          sessions.push(bpm);
          inTime = Date.now(0);
          currentSession.length = 0;
          taps.length = 0;
        }
      }, 5000);

      return bpm;
    }

    function updateBpm(newBpm) {
      document.querySelectorAll(".bpm-input").forEach((input) => {
        input.removeEventListener("change", handleChange);
        setBpm(newBpm);
        input.addEventListener("change", handleChange);
      });
    }

    function handleClick() {
      const bpm = measureBpm();
      setBpm(bpm);
      document.getElementById("bpm-monitor").innerText = bpm;
    }
    document.querySelector("#bpm-btn").addEventListener("click", handleClick);
    console.log("Added!");
  });
})();
