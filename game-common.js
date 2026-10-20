
function gameSoundEnabled() {
    try { return JSON.parse(localStorage.getItem("tictoc-preferences") || "{}").soundEnabled !== false; }
    catch { return true; }
}

function playGameNoticeSound() {
    if (!gameSoundEnabled()) return;
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        const context = new AudioContextClass();
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "sine"; oscillator.frequency.value = 660;
        gain.gain.setValueAtTime(0.045, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.12);
        oscillator.connect(gain); gain.connect(context.destination);
        oscillator.start(); oscillator.stop(context.currentTime + 0.12);
        oscillator.onended = () => context.close();
    } catch { /* Audio is optional; never block game flow. */ }
}

async function finishGame(
    game,
    score,
    won = false
) {

    score =
        Math.max(
            0,
            Math.floor(Number(score) || 0)
        );

    try {

        const response =
            await fetch(
                "/api/score",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            game,
                            score,
                            won
                        })
                }
            );

        if (
            response.status === 401
        ) {

            return {
                loggedIn: false,
                score
            };
        }

        const data =
            await response.json();

        if (!response.ok || !data.success) {
            showGameMessage(data.message || "Score could not be saved.");
            return { loggedIn: true, score, saved: false };
        }

        if (data.unlocked) {

            data.unlocked.forEach(
                achievement => {

                    showGameMessage(
                        "🏆 Achievement: " +
                        achievement
                    );

                }
            );
        }

        showGameMessage(
            `+${data.xpReward} XP   +${data.coinReward} Coins`
        );

        return {
            ...data,
            loggedIn: true,
            saved: true,
            score
        };

    } catch (error) {

        console.error(error);

        return {
            loggedIn: false,
            score
        };
    }
}


function showGameMessage(message) {

    let box =
        document.getElementById(
            "gameMessage"
        );

    if (!box) {

        box =
            document.createElement(
                "div"
            );

        box.id =
            "gameMessage";

        box.style.position =
            "fixed";

        box.style.right =
            "20px";

        box.style.bottom =
            "20px";

        box.style.padding =
            "14px 20px";

        box.style.borderRadius =
            "14px";

        box.style.background =
            "#171a2b";

        box.style.color =
            "white";

        box.style.border =
            "1px solid rgba(255,255,255,.15)";

        box.style.zIndex =
            "9999";

        document.body.appendChild(
            box
        );
    }

    box.textContent =
        message;
    playGameNoticeSound();

    box.style.opacity =
        "1";

    setTimeout(() => {

        box.style.opacity =
            "0";

    }, 2500);
}


function goHome() {

    window.location.href =
        "/";
}
