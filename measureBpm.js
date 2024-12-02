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
        outTime = currentSession[len - 1],
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
