const mapLogos = {
  "Mirage": "https://static.wikia.nocookie.net/cswikia/images/9/96/Set_mirage.png/revision/latest/scale-to-width-down/1000?cb=20230901185633",
  "Vertigo": "https://static.wikia.nocookie.net/cswikia/images/4/46/Vertigo-logo-new.png/revision/latest/scale-to-width-down/1000?cb=20230901185803",
  "Nuke": "https://static.wikia.nocookie.net/cswikia/images/e/ef/Set_nuke_2.png/revision/latest/scale-to-width-down/1000?cb=20230901185652",
  "Inferno": "https://static.wikia.nocookie.net/cswikia/images/0/0a/CS2_inferno_logo.png/revision/latest/scale-to-width-down/1000?cb=20230901170051",
  "Dust 2": "https://static.wikia.nocookie.net/cswikia/images/d/db/Map_icon_de_dust2.png/revision/latest/scale-to-width-down/1000?cb=20230901185539",
  "Train": "https://static.wikia.nocookie.net/cswikia/images/d/d3/CS2_Train_logo.png/revision/latest/scale-to-width-down/1000?cb=20241114093558",
  "Ancient": "https://static.wikia.nocookie.net/cswikia/images/7/7c/Map_icon_de_ancient.png/revision/latest/scale-to-width-down/1000?cb=20230901185140",
  "Overpass": "https://static.wikia.nocookie.net/cswikia/images/3/3c/CS2_overpass_logo.png/revision/latest/scale-to-width-down/1000?cb=20230901170006",
  "Anubis": "https://static.wikia.nocookie.net/cswikia/images/f/f8/Map_icon_de_anubis.png/revision/latest/scale-to-width-down/1000?cb=20230901185250",
  "Cache": "https://static.wikia.nocookie.net/cswikia/images/b/b8/Set_cache_cs2.png/revision/latest/scale-to-width-down/1000?cb=20260429100550"
};

const mapImages = {
  "Mirage": "https://static.wikia.nocookie.net/cswikia/images/f/f5/De_mirage_cs2.png/revision/latest/scale-to-width-down/1000?cb=20230807124319",
  "Vertigo": "https://static.wikia.nocookie.net/cswikia/images/8/88/De_vertigo_cs2.jpg/revision/latest/scale-to-width-down/1000?cb=20231009185617",
  "Ancient": "https://static.wikia.nocookie.net/cswikia/images/5/5c/De_ancient_cs2.png/revision/latest/scale-to-width-down/1000?cb=20250815011913",
  "Overpass": "https://static.wikia.nocookie.net/cswikia/images/5/55/Overpass_loading_screen.png/revision/latest/scale-to-width-down/1000?cb=20250730205333",
  "Inferno": "https://static.wikia.nocookie.net/cswikia/images/1/17/Cs2_inferno_remake.png/revision/latest/scale-to-width-down/1000?cb=20260304235624",
  "Nuke": "https://static.wikia.nocookie.net/cswikia/images/d/d6/De_nuke_cs2.png/revision/latest/scale-to-width-down/1000?cb=20240426010253",
  "Anubis": "https://static.wikia.nocookie.net/cswikia/images/a/a0/CS2_Anubis_B_site.png/revision/latest/scale-to-width-down/1000?cb=20260122021359",
  "Dust 2": "https://static.wikia.nocookie.net/cswikia/images/1/16/Cs2_dust2.png/revision/latest/scale-to-width-down/1000?cb=20230913150804",
  "Train": "https://static.wikia.nocookie.net/cswikia/images/2/2c/De_train_cs2_new.png/revision/latest/scale-to-width-down/1000?cb=20250730205931",
  "Cache": "https://static.wikia.nocookie.net/cswikia/images/5/5b/De_cache_cs2.png/revision/latest/scale-to-width-down/1000?cb=20260429100503"
};

function startDpcDashboard(player) {
  const app = document.getElementById("app");

  loadDashboard();

  async function loadDashboard() {
    app.innerHTML = `
      <div class="loader-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;

    try {
      const response = await fetch(`${MATCH_API_URL}?action=dpc&player=${player}&t=${Date.now()}`);
      const data = await response.json();

      render(data);
    } catch (error) {
      console.error(error);

      app.innerHTML = `
        <p class="loading">Erreur : impossible de charger le dashboard.</p>
      `;
    }
  }

  function render(data) {
    app.innerHTML = `
      <div class="dpc-container">
        ${renderAddPremierBox()}
        ${renderDashboard("Dashboard Premier", data.premier, "premier")}
        ${renderDashboard("Dashboard Compétitions", data.competitions, "competitions")}
      </div>
    `;

    activatePremierForm();
  }

  function renderAddPremierBox() {
    return `
      <section class="add-match-card">
        <div>
          <h2>Ajouter une game Premier</h2>
          <p>Colle le lien Leetify du match.</p>
        </div>

        <div class="add-match-form">
          <input id="premierLink" type="text" placeholder="Lien Leetify du match">
          <button id="addPremierBtn">Ajouter</button>
        </div>

        <div id="addPremierStatus" class="add-status"></div>
      </section>
    `;
  }

  function activatePremierForm() {
    const button = document.getElementById("addPremierBtn");
    const input = document.getElementById("premierLink");
    const status = document.getElementById("addPremierStatus");

    button.addEventListener("click", async () => {
      const url = input.value.trim();

      if (!url) {
        status.textContent = "Colle un lien Leetify.";
        status.className = "add-status error";
        return;
      }

      button.disabled = true;
      button.textContent = "Ajout...";
      status.textContent = "";

      try {
        const response = await fetch(`${MATCH_API_URL}?action=addPremier`, {
          method: "POST",
          body: JSON.stringify({
            player,
            url
          })
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || "Erreur inconnue.");
        }

        input.value = "";
        status.textContent = "Match Premier ajouté ✓";
        status.className = "add-status success";

        await loadDashboard();
      } catch (error) {
        status.textContent = error.message;
        status.className = "add-status error";
      }

      button.disabled = false;
      button.textContent = "Ajouter";
    });
  }

  function renderDashboard(title, dashboard, type) {
    return `
      <section class="dashboard-card ${type}">
        <div class="dashboard-header">
          <div>
            <p class="eyebrow">${type === "premier" ? "Mode Premier" : "Mode Compétitions"}</p>
            <h2 class="dashboard-title">${title}</h2>
          </div>

          <div class="big-winrate">
            <span>${dashboard.stats.winrate}</span>
            <small>Winrate</small>
          </div>
        </div>

        <div class="stats-grid">
          ${renderStat("Total Match", dashboard.stats.totalMatch)}
          ${renderStat("Victoires", dashboard.stats.victories)}
          ${renderStat("Draw", dashboard.stats.draw)}
          ${renderStat("Défaites", dashboard.stats.defeats)}
          ${renderStat("Total 1K", dashboard.stats.total1K)}
          ${renderStat("Total 2K", dashboard.stats.total2K)}
          ${renderStat("Total 3K", dashboard.stats.total3K)}
          ${renderStat("Total 4K", dashboard.stats.total4K)}
          ${renderStat("Total 5K", dashboard.stats.total5K)}
        </div>

        <div class="best-header">
          <h3>Meilleure game par map</h3>
          <p>Trié par kills.</p>
        </div>

        <div class="best-grid">
          ${dashboard.bestMaps.map(map => renderBestMap(map)).join("")}
        </div>
      </section>
    `;
  }

  function renderStat(label, value) {
    return `
      <div class="stat-box">
        <div class="stat-label">${label}</div>
        <div class="stat-value">${value}</div>
      </div>
    `;
  }

  function renderBestMap(map) {
    const kd = Number(map.kd) || 0;

    return `
      <article class="map-best-card">
        <img class="map-bg" src="${mapImages[map.map]}" alt="${map.map}">

        <div class="map-overlay"></div>

        <div class="map-best-content">
          <div class="map-name-line">
            <img class="map-logo-small" src="${mapLogos[map.map]}" alt="${map.map}">
            <h4>${map.map}</h4>
          </div>

          <div class="map-stats">
            <span>Kills : <b>${map.kills}</b></span>
            <span>Deaths : <b>${map.deaths}</b></span>
            <span class="${kdClass(kd)}">K/D <b>${formatKD(kd)}</b></span>
          </div>
        </div>
      </article>
    `;
  }

  function formatKD(value) {
    return Number(value).toFixed(2);
  }

  function kdClass(value) {
    value = Number(value);

    if (value < 0.90) return "kd-red";
    if (value <= 1.10) return "kd-orange";
    if (value <= 1.30) return "kd-lightgreen";

    return "kd-darkgreen";
  }
}