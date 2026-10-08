let authMode = "login";


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


function openAuth() {

    const modal =
        document.getElementById("authModal");

    if (modal) {
        modal.classList.add("show");
    }
}


function closeAuth() {

    const modal =
        document.getElementById("authModal");

    if (modal) {
        modal.classList.remove("show");
    }
}


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
        document.getElementById(
            "authSubmitText"
        );

    const switchButton =
        document.getElementById(
            "authSwitch"
        );

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

    } else {

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


async function handleAuth(event) {

    event.preventDefault();

    const name =
        document.getElementById(
            "authName"
        ).value;

    const email =
        document.getElementById(
            "authEmail"
        ).value;

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
                data.message
            );

            return;
        }

        showToast(
            data.message
        );

        closeAuth();

        updateLoginButton();

        document
            .getElementById("authForm")
            ?.reset();

    } catch (error) {

        showToast(
            "Unable to connect to server."
        );
    }
}


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

        } else {

            button.textContent =
                "Login";

            button.onclick =
                openAuth;
        }

    } catch (error) {

        console.log(error);

    }
}


function filterGames(
    category,
    button
) {

    document
        .querySelectorAll(".category")
        .forEach(
            item =>
                item.classList.remove(
                    "active"
                )
        );

    button.classList.add(
        "active"
    );

    document
        .querySelectorAll(".game-card")
        .forEach(card => {

            if (
                category === "all" ||
                card.dataset.category ===
                    category
            ) {

                card.style.display = "";

            } else {

                card.style.display =
                    "none";
            }

        });
}


function searchGames() {

    const input =
        document.getElementById(
            "gameSearch"
        );

    if (!input) return;

    const value =
        input.value.toLowerCase();

    document
        .querySelectorAll(".game-card")
        .forEach(card => {

            const name =
                card.dataset.name
                    .toLowerCase();

            card.style.display =
                name.includes(value)
                    ? ""
                    : "none";

        });
}


function toggleTheme() {

    document.body.classList.toggle(
        "light"
    );

    const light =
        document.body.classList.contains(
            "light"
        );

    localStorage.setItem(
        "tictoc-theme",
        light
            ? "light"
            : "dark"
    );
}


function loadTheme() {

    const theme =
        localStorage.getItem(
            "tictoc-theme"
        );

    if (theme === "light") {

        document.body.classList.add(
            "light"
        );
    }
}


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

        } else {

            showToast(
                "Removed from favorites"
            );
        }

        loadFavorites();

    } catch (error) {

        showToast(
            "Unable to update favorite."
        );
    }
}


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
            data.favorites.map(
                item => item.game
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

                } else {

                    button.classList.remove(
                        "active"
                    );

                    button.textContent =
                        "♡";
                }

            });

    } catch (error) {

        console.log(error);

    }
}


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

        title.textContent =
            challenge.game +
            " Challenge";

        description.textContent =
            challenge.text;

        reward.textContent =
            "🎁 " +
            challenge.reward;

    } catch (error) {

        title.textContent =
            "Daily Challenge";

        description.textContent =
            "Play any game today.";

        reward.textContent =
            "🎁 Rewards available";
    }
}


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

        if (
            !data.leaderboard.length
        ) {

            container.innerHTML = `
                <div class="leader-row">
                    <span>🏆</span>
                    <span>No scores yet</span>
                    <span>Play a game!</span>
                    <strong>---</strong>
                </div>
            `;

            return;
        }

        container.innerHTML =
            data.leaderboard
                .map(
                    (item,index) => `
                    <div class="leader-row">

                        <span class="rank">
                            #${index + 1}
                        </span>

                        <span class="player">
                            ${escapeHTML(item.name)}
                        </span>

                        <span class="leader-game">
                            ${escapeHTML(item.game)}
                        </span>

                        <span class="leader-score">
                            ${item.score}
                        </span>

                    </div>
                `
                )
                .join("");

    } catch (error) {

        container.innerHTML =
            "Leaderboard unavailable.";

    }
}


function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function recordGame(game) {

    localStorage.setItem(
        "lastGame",
        game
    );
}


document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadTheme();

        updateLoginButton();

        loadFavorites();

        loadLeaderboard();

        loadDailyChallenge();

    }
);