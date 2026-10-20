// ==========================================
// TicToc Toy Games - Main App JavaScript
// ==========================================


// ==========================================
// AUTH MODE
// ==========================================

let authMode = "login";


// ==========================================
// TOAST MESSAGE
// ==========================================

function showToast(message) {

    const toast =
        document.getElementById("toast");

    if (!toast) return;

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove("show");

    }, 2800);
}


// ==========================================
// OPEN LOGIN / REGISTER MODAL
// ==========================================

function openAuth() {

    const modal =
        document.getElementById("authModal");

    if (modal) {

        modal.classList.add("show");

    }
}


// ==========================================
// CLOSE LOGIN / REGISTER MODAL
// ==========================================

function closeAuth() {

    const modal =
        document.getElementById("authModal");

    if (modal) {

        modal.classList.remove("show");

    }
}


// ==========================================
// LOGIN / REGISTER SWITCH
// ==========================================

function toggleAuthMode() {

    authMode =
        authMode === "login"
            ? "register"
            : "login";


    const title =
        document.getElementById("authTitle");

    const subtitle =
        document.getElementById("authSubtitle");

    const nameField =
        document.getElementById("nameField");

    const submitText =
        document.getElementById("authSubmitText");

    const switchButton =
        document.getElementById("authSwitch");


    if (authMode === "register") {

        title.textContent =
            "Join TicToc";

        subtitle.textContent =
            "Create your player account.";

        nameField.classList.remove(
            "hidden"
        );

        submitText.textContent =
            "Create Account";

        switchButton.textContent =
            "Already registered? Login";

    }

    else {

        title.textContent =
            "Welcome Back";

        subtitle.textContent =
            "Login to continue playing.";

        nameField.classList.add(
            "hidden"
        );

        submitText.textContent =
            "Login";

        switchButton.textContent =
            "New here? Create an account";

    }

}


// ==========================================
// LOGIN / REGISTER
// ==========================================

async function handleAuth(event) {

    event.preventDefault();


    const name =
        document.getElementById(
            "authName"
        ).value.trim();


    const email =
        document.getElementById(
            "authEmail"
        ).value.trim();


    const password =
        document.getElementById(
            "authPassword"
        ).value;


    const endpoint =
        authMode === "login"
            ? "/api/login"
            : "/api/register";


    const body =
        authMode === "login"

            ? {
                email,
                password
            }

            : {
                name,
                email,
                password
            };


    try {

        const response =
            await fetch(
                endpoint,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(body)
                }
            );


        const data =
            await response.json();


        if (!data.success) {

            showToast(
                data.message ||
                "Authentication failed."
            );

            return;
        }


        showToast(
            data.message ||
            "Success!"
        );


        closeAuth();


        await updateLoginButton();
        await loadTheme();
        await loadFavorites();
        await loadDailyChallenge();

        document
            .getElementById("authForm")
            ?.reset();

    }

    catch (error) {

        console.error(
            "Authentication error:",
            error
        );


        showToast(
            "Unable to connect to server."
        );

    }

}


// ==========================================
// UPDATE LOGIN / PROFILE BUTTON
// ==========================================

async function updateLoginButton() {

    const button =
        document.getElementById(
            "profileButton"
        );


    if (!button) return;


    try {

        const response =
            await fetch(
                "/api/me"
            );


        const data =
            await response.json();


        if (data.loggedIn) {

            button.textContent =
                "👤 " + data.user.name;


            button.onclick = () => {

                window.location.href =
                    "/profile.html";

            };

        }

        else {

            button.textContent =
                "Login";


            button.onclick =
                openAuth;

        }

    }

    catch (error) {

        console.log(
            "Unable to check login:",
            error
        );

    }

}


// ==========================================
// GAME CATEGORY FILTER
// ==========================================

function filterGames(
    category,
    button
) {

    document
        .querySelectorAll(".category")
        .forEach(item => {

            item.classList.remove(
                "active"
            );

        });


    if (button) {

        button.classList.add(
            "active"
        );

    }


    activeCategory = category;
    applyGameFilters();

}


function applyGameFilters() {
    const value = (document.getElementById("gameSearch")?.value || "").toLowerCase().trim();
    document.querySelectorAll(".game-card").forEach(card => {
        const categoryMatches = activeCategory === "all" || card.dataset.category === activeCategory;
        const haystack = `${card.dataset.name || ""} ${card.dataset.category || ""} ${card.textContent || ""}`.toLowerCase();
        card.style.display = categoryMatches && haystack.includes(value) ? "" : "none";
    });
}

// ==========================================
// SEARCH GAMES
// ==========================================

function searchGames() {

    const input =
        document.getElementById(
            "gameSearch"
        );


    if (!input) return;


    applyGameFilters();

}


// ==========================================
// PERSONALIZATION / THEMES
// ==========================================
let activeCategory = "all";
let preferences = { theme: "cyberpunk", soundEnabled: true, animationsEnabled: true };

function toggleSettingsPanel() {
    const panel = document.getElementById("settingsPanel");
    const button = document.getElementById("settingsButton");
    if (!panel) return;
    const opening = panel.classList.contains("hidden");
    panel.classList.toggle("hidden", !opening);
    if (button) button.setAttribute("aria-expanded", String(opening));
}

function applyTheme(theme) {
    const valid = ["cyberpunk", "space", "retro"].includes(theme) ? theme : "cyberpunk";
    document.body.classList.remove("theme-space", "theme-retro", "light");
    if (valid === "space") document.body.classList.add("theme-space");
    if (valid === "retro") document.body.classList.add("theme-retro");
    document.body.dataset.theme = valid;
    document.querySelectorAll("[data-theme-choice]").forEach(button => {
        button.classList.toggle("selected", button.dataset.themeChoice === valid);
        button.setAttribute("aria-pressed", String(button.dataset.themeChoice === valid));
    });
}

async function persistPreferences() {
    localStorage.setItem("tictoc-preferences", JSON.stringify(preferences));
    const status = document.getElementById("settingsStatus");
    try {
        const response = await fetch("/api/preferences", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(preferences) });
        if (response.ok) { if (status) status.textContent = "Preferences saved to your account and this device."; return; }
        if (response.status === 401) { if (status) status.textContent = "Saved on this device. Log in to sync preferences across sessions."; return; }
        if (status) status.textContent = "Saved on this device. Account sync is temporarily unavailable.";
    } catch { if (status) status.textContent = "Saved on this device. Account sync is unavailable while offline."; }
}

async function setTheme(theme) { preferences.theme = theme; applyTheme(theme); await persistPreferences(); }
async function setPreference(key, value) {
    if (!["soundEnabled", "animationsEnabled"].includes(key) || typeof value !== "boolean") return;
    preferences[key] = value;
    document.body.classList.toggle("reduce-motion", !preferences.animationsEnabled);
    await persistPreferences();
}

async function loadTheme() {
    try {
        const local = JSON.parse(localStorage.getItem("tictoc-preferences") || "{}");
        preferences = { ...preferences, ...local };
    } catch {}
    try {
        const response = await fetch("/api/preferences");
        if (response.ok) { const data = await response.json(); if (data.preferences) preferences = { ...preferences, ...data.preferences }; }
    } catch {}
    applyTheme(preferences.theme);
    const sound = document.getElementById("soundSetting"); const animation = document.getElementById("animationSetting");
    if (sound) sound.checked = preferences.soundEnabled;
    if (animation) animation.checked = preferences.animationsEnabled;
    document.body.classList.toggle("reduce-motion", !preferences.animationsEnabled);
}

function toggleTheme() {
    const themes = ["cyberpunk", "space", "retro"];
    const next = themes[(themes.indexOf(preferences.theme) + 1) % themes.length];
    setTheme(next);
}

// ==========================================
// FAVORITES
// ==========================================

async function toggleFavorite(game) {

    try {

        const response =
            await fetch(
                "/api/favorites",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            game
                        })
                }
            );


        if (response.status === 401) {

            openAuth();


            showToast(
                "Login to save favorites."
            );


            return;

        }


        const data =
            await response.json();


        if (data.favorite) {

            showToast(
                "❤️ Added to favorites"
            );

        }

        else {

            showToast(
                "Removed from favorites"
            );

        }


        loadFavorites();

    }

    catch (error) {

        console.error(
            "Favorite error:",
            error
        );


        showToast(
            "Unable to update favorite."
        );

    }

}


// ==========================================
// LOAD FAVORITES
// ==========================================

async function loadFavorites() {

    try {

        const response =
            await fetch(
                "/api/favorites"
            );


        if (response.status === 401) {

            return;

        }


        const data =
            await response.json();


        const favoriteNames =
            (data.favorites || [])
                .map(
                    item =>
                        String(item.game)
                );


        document
            .querySelectorAll(
                ".favorite-button"
            )
            .forEach(button => {

                const game =
                    button.dataset.game;


                if (
                    favoriteNames.includes(
                        game
                    )
                ) {

                    button.classList.add(
                        "active"
                    );


                    button.textContent =
                        "♥";

                }

                else {

                    button.classList.remove(
                        "active"
                    );


                    button.textContent =
                        "♡";

                }

            });

    }

    catch (error) {

        console.log(
            "Favorites unavailable:",
            error
        );

    }

}


// ==========================================
// DAILY CHALLENGE
// ==========================================

async function loadDailyChallenge() {

    const title =
        document.getElementById(
            "challengeTitle"
        );


    const description =
        document.getElementById(
            "challengeDescription"
        );


    const reward =
        document.getElementById(
            "challengeReward"
        );


    if (!title) return;


    try {

        const response =
            await fetch(
                "/api/daily-challenge"
            );


        const data =
            await response.json();


        const challenge =
            data.challenge;


        if (!challenge) {

            throw new Error(
                "Challenge not found"
            );

        }


        title.textContent =
            challenge.game +
            " Challenge";


        description.textContent =
            challenge.text;


        reward.textContent =
            data.claimed ? "✓ Reward claimed today" : (data.completed ? "✓ Complete — " : "🎁 ") + challenge.reward;
        const claimButton = document.getElementById("challengeClaimButton");
        if (claimButton) claimButton.textContent = data.claimed ? "Claimed ✓" : (data.completed ? "Claim reward →" : (data.loggedIn ? "Check challenge →" : "Login to claim →"));
        if (claimButton) claimButton.disabled = !!data.claimed;

    }

    catch (error) {

        console.log(
            "Daily challenge error:",
            error
        );


        title.textContent =
            "Daily Challenge";


        description.textContent =
            "Play any game today.";


        reward.textContent =
            "🎁 Rewards available";

    }

}


// ==========================================
// LEADERBOARD
// ==========================================

async function loadLeaderboard() {

    const container =
        document.getElementById(
            "leaderboard"
        );


    if (!container) return;


    try {

        const response =
            await fetch(
                "/api/leaderboard"
            );


        const data =
            await response.json();


        const leaderboard =
            data.leaderboard || [];


        if (!leaderboard.length) {

            container.innerHTML = `

                <div class="leader-row">

                    <span>
                        🏆
                    </span>

                    <span>
                        No scores yet
                    </span>

                    <span>
                        Play a game!
                    </span>

                    <strong>
                        ---
                    </strong>

                </div>

            `;

            return;

        }


        container.innerHTML =
            leaderboard
                .map(
                    (item, index) => `

                    <div class="leader-row">

                        <span class="rank">
                            #${index + 1}
                        </span>

                        <span class="player">
                            ${escapeHTML(
                                item.name
                            )}
                        </span>

                        <span class="leader-game">
                            ${escapeHTML(
                                formatGameName(
                                    item.game
                                )
                            )}
                        </span>

                        <span class="leader-score">
                            ${item.score}
                        </span>

                    </div>

                `
                )
                .join("");

    }

    catch (error) {

        console.error(
            "Leaderboard error:",
            error
        );


        container.innerHTML =
            "Leaderboard unavailable.";

    }

}


// ==========================================
// GAME NAME FORMATTER
// ==========================================

function formatGameName(game) {

    const names = {

        "snake":
            "Neon Snake",

        "tic-tac-toe":
            "Tic-Tac-Toe",

        "brick-breaker":
            "Brick Breaker",

        "pong":
            "Cyber Pong",

        "memory-match":
            "Memory Match",

        "2048":
            "2048 Hyper",

        "neon-rail-runner":
            "Neon Rail Runner",

        "mountain-torque":
            "Mountain Torque",

        "jungle-escape":
            "Jungle Escape 3D",

        "monster-sky-jump":
            "Monster Sky Jump"

    };


    return names[game] || game;

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(value) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


// ==========================================
// RECENTLY PLAYED GAMES / PLAYER PROGRESS
// ==========================================
function getLastPlayedGame() {
    try {
        const recent = JSON.parse(localStorage.getItem("tictoc-recent-games") || "[]");
        return Array.isArray(recent) && recent.length ? recent[0].game : null;
    } catch {
        return null;
    }
}

function openCreativeDesign() {
    const panel = document.getElementById("settingsPanel");
    if (panel) {
        panel.classList.remove("hidden");
        panel.scrollIntoView({ behavior: "smooth", block: "center" });
        const button = document.getElementById("settingsButton");
        if (button) button.setAttribute("aria-expanded", "true");
    } else {
        showToast("Use the settings button to change your theme.");
    }
}

function recordGame(game) {
    let recent = [];
    try { recent = JSON.parse(localStorage.getItem("tictoc-recent-games") || "[]"); } catch {}
    recent = [{ game, playedAt: new Date().toISOString() }, ...recent.filter(item => item.game !== game)].slice(0, 4);
    localStorage.setItem("tictoc-recent-games", JSON.stringify(recent));
    renderRecentGames();
}

function renderRecentGames() {
    const section = document.getElementById("recentlyPlayedSection");
    const container = document.getElementById("recentGames");
    if (!section || !container) return;
    let recent = [];
    try { recent = JSON.parse(localStorage.getItem("tictoc-recent-games") || "[]"); } catch {}
    const links = { "Snake": "snake.html", "Tic-Tac-Toe": "tic-tac-toe.html", "2048": "2048.html", "Pong": "pong.html", "Brick Breaker": "brick-breaker.html", "Memory Match": "memory-match.html", "Neon Runner": "neon-runner.html" };
    const emojis = { "Snake": "🐍", "Tic-Tac-Toe": "⭕", "2048": "🔢", "Pong": "🏓", "Brick Breaker": "🧱", "Memory Match": "🧠", "Neon Runner": "🏃" };
    if (!recent.length) { section.classList.add("hidden"); return; }
    section.classList.remove("hidden");
    container.innerHTML = recent.filter(item => links[item.game]).map(item => `<a class="recent-game" href="/games/${links[item.game]}" onclick="recordGame('${item.game}')"><span>${emojis[item.game]}</span><strong>${escapeHTML(item.game)}</strong><small>Play again →</small></a>`).join("");
}

async function claimDailyChallenge() {
    const button = document.getElementById("challengeClaimButton");
    if (button) button.disabled = true;
    try {
        const response = await fetch("/api/daily-challenge/claim", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
        const data = await response.json();
        if (response.status === 401) { openAuth(); showToast("Log in and complete today's challenge to claim rewards."); }
        else if (!response.ok) showToast(data.message || "Challenge is not complete yet.");
        else { showToast("Challenge reward claimed: +100 XP and +50 coins!"); await loadTheme(); }
        await loadDailyChallenge();
    } catch { showToast("Unable to check challenge right now."); }
    finally { if (button) button.disabled = false; }
}

// ==========================================
// NEW GAME INFORMATION
// ==========================================

const newGames = [

    {
        id: "neon-rail-runner",
        title: "Neon Rail Runner",
        category: "adventure",
        url: "/games/neon-rail-runner.html"
    },

    {
        id: "mountain-torque",
        title: "Mountain Torque",
        category: "racing",
        url: "/games/mountain-torque.html"
    },

    {
        id: "jungle-escape",
        title: "Jungle Escape 3D",
        category: "adventure",
        url: "/games/jungle-escape.html"
    },

    {
        id: "monster-sky-jump",
        title: "Monster Sky Jump",
        category: "arcade",
        url: "/games/monster-sky-jump.html"
    }

];


// ==========================================
// CHECK NEW GAME
// ==========================================

function isNewGame(gameId) {

    return newGames.some(
        game => game.id === gameId
    );

}


// ==========================================
// START PAGE
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadTheme();
        renderRecentGames();

        updateLoginButton();

        loadFavorites();

        loadLeaderboard();

        loadDailyChallenge();

    }
);


// ==========================================
// MAKE FUNCTIONS AVAILABLE TO HTML
// ==========================================

window.showToast =
    showToast;

window.openAuth =
    openAuth;

window.closeAuth =
    closeAuth;

window.toggleAuthMode =
    toggleAuthMode;

window.handleAuth =
    handleAuth;

window.updateLoginButton =
    updateLoginButton;

window.filterGames =
    filterGames;

window.searchGames =
    searchGames;

window.toggleTheme =
    toggleTheme;

window.toggleFavorite =
    toggleFavorite;

window.loadFavorites =
    loadFavorites;

window.loadDailyChallenge =
    loadDailyChallenge;

window.loadLeaderboard =
    loadLeaderboard;

window.recordGame =
    recordGame;

window.getLastPlayedGame =
    getLastPlayedGame;
window.openCreativeDesign = openCreativeDesign;

window.formatGameName =
    formatGameName;
window.toggleSettingsPanel = toggleSettingsPanel;
window.setTheme = setTheme;
window.setPreference = setPreference;
window.claimDailyChallenge = claimDailyChallenge;
window.recordGame = recordGame;
