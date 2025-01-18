/**
 * Tabbable.js
 *
 * Retrieves all tabbable elements within the document.
 * Tabbable elements include anchors, buttons, inputs, textareas, selects, details, and elements with a positive tabindex.
 *
 * @returns {HTMLElement[]} An array of tabbable elements.
 *
 */
function tabbable() {
    const elements = document.querySelectorAll(
        'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
    );

    return Array.from(elements).filter((element) => {
        return (
            element.tabIndex >= 0 &&
            !element.disabled &&
            element.offsetParent !== null
        );
    });
}
