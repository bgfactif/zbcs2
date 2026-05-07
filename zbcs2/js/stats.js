const weapons = [
  "Desert Eagle",
  "Galil AR",
  "AK-47",
  "M4A4",
  "M4A1-S",
  "AWP"
];

const maps = [
  ["Mirage", "https://static.wikia.nocookie.net/cswikia/images/9/96/Set_mirage.png/revision/latest/scale-to-width-down/1000?cb=20230901185633"],
  ["Vertigo", "https://static.wikia.nocookie.net/cswikia/images/4/46/Vertigo-logo-new.png/revision/latest/scale-to-width-down/1000?cb=20230901185803"],
  ["Nuke", "https://static.wikia.nocookie.net/cswikia/images/e/ef/Set_nuke_2.png/revision/latest/scale-to-width-down/1000?cb=20230901185652"],
  ["Inferno", "https://static.wikia.nocookie.net/cswikia/images/0/0a/CS2_inferno_logo.png/revision/latest/scale-to-width-down/1000?cb=20230901170051"],
  ["Dust 2", "https://static.wikia.nocookie.net/cswikia/images/d/db/Map_icon_de_dust2.png/revision/latest/scale-to-width-down/1000?cb=20230901185539"],
  ["Train", "https://static.wikia.nocookie.net/cswikia/images/d/d3/CS2_Train_logo.png/revision/latest/scale-to-width-down/1000?cb=20241114093558"],
  ["Ancient", "https://static.wikia.nocookie.net/cswikia/images/7/7c/Map_icon_de_ancient.png/revision/latest/scale-to-width-down/1000?cb=20230901185140"],
  ["Overpass", "https://static.wikia.nocookie.net/cswikia/images/3/3c/CS2_overpass_logo.png/revision/latest/scale-to-width-down/1000?cb=20230901170006"],
  ["Anubis", "https://static.wikia.nocookie.net/cswikia/images/f/f8/Map_icon_de_anubis.png/revision/latest/scale-to-width-down/1000?cb=20230901185250"],
  ["Cache", "https://static.wikia.nocookie.net/cswikia/images/b/b8/Set_cache_cs2.png/revision/latest/scale-to-width-down/1000?cb=20260429100550"]
];

function startStats(team) {
  const app = document.getElementById("app");
  let data = createDefaultData();

  init();

  async function init() {
    app.innerHTML = `
      <div class="loader-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;

    await loadFromGoogleSheet();
    render();
  }

  function createDefaultData() {
    const defaultData = {};

    weapons.forEach(weapon => {
      defaultData[weapon] = {};

      maps.forEach(([map]) => {
        defaultData[weapon][map] = {
          kills: 0,
          deaths: 0
        };
      });
    });

    return defaultData;
  }

  async function loadFromGoogleSheet() {
    try {
      const url = (typeof MAM_API_URL !== "undefined" && MAM_API_URL) ? MAM_API_URL : API_URL;
      const response = await fetch(`${url}&t=${Date.now()}`);
      const text = await response.text();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} - ${text.slice(0, 120)}`);
      }

      let rows;
      try {
        rows = JSON.parse(text);
      } catch (jsonError) {
        throw new Error(`Réponse Apps Script pas en JSON. Déploiement/autorisation à vérifier. Début réponse: ${text.slice(0, 120)}`);
      }

      if (rows && rows.ok === false) {
        throw new Error(rows.error || "Apps Script a répondu ok:false");
      }

      if (!Array.isArray(rows)) {
        throw new Error("Réponse Google Sheet invalide : ce n'est pas une liste de stats.");
      }

      rows.forEach(row => {
        const rowTeam = String(row.team || "").trim();
        const rowWeapon = String(row.weapon || "").trim();
        const rowMap = String(row.map || "").trim();

        if (
          rowTeam === team &&
          data[rowWeapon] &&
          data[rowWeapon][rowMap]
        ) {
          data[rowWeapon][rowMap].kills = Number(row.kills) || 0;
          data[rowWeapon][rowMap].deaths = Number(row.deaths) || 0;
        }
      });
    } catch (error) {
      console.error(error);

      app.innerHTML = `
        <div class="sheet-error">
          <h2>Erreur : Google Sheet ne charge pas</h2>
          <p>${escapeHtml(error.message || String(error))}</p>
          <button id="retry-load" type="button">Réessayer</button>
        </div>
      `;

      const retryButton = document.getElementById("retry-load");
      if (retryButton) {
        retryButton.addEventListener("click", init);
      }

      throw error;
    }
  }

  async function saveWeaponToGoogleSheet(weapon) {
    const entries = maps.map(([map]) => ({
      team: team,
      weapon: weapon,
      map: map,
      kills: Number(data[weapon][map].kills) || 0,
      deaths: Number(data[weapon][map].deaths) || 0
    }));

    const url = (typeof MAM_API_URL !== "undefined" && MAM_API_URL) ? MAM_API_URL : API_URL;
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify({
        mode: "batch",
        entries: entries
      })
    });

    const text = await response.text();
    let result;

    try {
      result = JSON.parse(text);
    } catch (jsonError) {
      throw new Error(`Sauvegarde : réponse pas en JSON. Début réponse: ${text.slice(0, 120)}`);
    }

    if (!response.ok || !result.ok) {
      throw new Error(result.error || `Sauvegarde impossible HTTP ${response.status}`);
    }

    await loadFromGoogleSheet();
    render();
    showSaved();
  }

  function calculateKD(kills, deaths) {
    kills = Number(kills) || 0;
    deaths = Number(deaths) || 0;

    if (deaths === 0) {
      return kills > 0 ? kills.toFixed(2) : "0.00";
    }

    return (kills / deaths).toFixed(2);
  }

  function kdClass(value) {
    value = Number(value);

    if (value < 0.90) return "kd-red";
    if (value <= 1.10) return "kd-orange";
    if (value <= 1.30) return "kd-lightgreen";

    return "kd-darkgreen";
  }

  function getTotals(weapon) {
    let kills = 0;
    let deaths = 0;

    maps.forEach(([map]) => {
      kills += Number(data[weapon][map].kills) || 0;
      deaths += Number(data[weapon][map].deaths) || 0;
    });

    return {
      kills: kills,
      deaths: deaths,
      kd: calculateKD(kills, deaths)
    };
  }

  function getSortedWeapons() {
    return [...weapons].sort((a, b) => {
      const totalA = getTotals(a);
      const totalB = getTotals(b);

      if (totalB.kills !== totalA.kills) {
        return totalB.kills - totalA.kills;
      }

      return Number(totalB.kd) - Number(totalA.kd);
    });
  }

  function getSortedMaps(weapon) {
    return [...maps].sort((a, b) => {
      const mapA = a[0];
      const mapB = b[0];

      const statsA = data[weapon][mapA];
      const statsB = data[weapon][mapB];

      const killsA = Number(statsA.kills) || 0;
      const killsB = Number(statsB.kills) || 0;

      const kdA = Number(calculateKD(statsA.kills, statsA.deaths));
      const kdB = Number(calculateKD(statsB.kills, statsB.deaths));

      if (killsB !== killsA) {
        return killsB - killsA;
      }

      return kdB - kdA;
    });
  }

  function render() {
    const sortedWeapons = getSortedWeapons();

    app.innerHTML = `
      <div class="weapons-grid">
        ${sortedWeapons.map(weapon => renderWeapon(weapon)).join("")}
      </div>

      <div id="saved" class="saved">
        Sauvegardé en ligne ✓
      </div>
    `;

    activateButtons();
  }

  function renderWeapon(weapon) {
    const total = getTotals(weapon);
    const sortedMaps = getSortedMaps(weapon);

    return `
      <article class="weapon-card">
        <div class="weapon-top">
          <h2>${weapon}</h2>

          <div class="totals">
            <span>K : ${total.kills}</span>
            <span>D : ${total.deaths}</span>
            <span class="${kdClass(total.kd)}">K/D : ${total.kd}</span>
          </div>
        </div>

        <button class="edit-weapon-btn" data-weapon="${weapon}">
          Ajouter / Modifier
        </button>

        ${sortedMaps.map(([map, logo]) => renderMapRow(weapon, map, logo)).join("")}
      </article>
    `;
  }

  function renderMapRow(weapon, map, logo) {
    const stats = data[weapon][map];
    const ratio = calculateKD(stats.kills, stats.deaths);

    return `
      <div class="map-row readonly">
        <img src="${logo}" alt="${map}">

        <div class="map-name">${map}</div>

        <div class="stat-box">${stats.kills}</div>
        <div class="stat-box">${stats.deaths}</div>

        <div class="kd ${kdClass(ratio)}">
          ${ratio}
        </div>
      </div>
    `;
  }

  function activateButtons() {
    document.querySelectorAll(".edit-weapon-btn").forEach(button => {
      button.addEventListener("click", () => {
        openWeaponModal(button.dataset.weapon);
      });
    });
  }

  function openWeaponModal(weapon) {
    const modal = document.createElement("div");
    modal.className = "mam-modal";

    modal.innerHTML = `
      <div class="mam-modal-box">
        <div class="mam-modal-top">
          <h2>${weapon}</h2>
          <button class="modal-close" type="button">×</button>
        </div>

        <div class="modal-header">
          <span>Map</span>
          <span>Kills</span>
          <span>Deaths</span>
        </div>

        <div class="modal-maps">
          ${maps.map(([map, logo]) => `
            <div class="modal-map-row">
              <div class="modal-map-name">
                <img src="${logo}" alt="${map}">
                <strong>${map}</strong>
              </div>

              <input
                type="number"
                min="0"
                value="${data[weapon][map].kills}"
                data-map="${map}"
                data-type="kills"
              >

              <input
                type="number"
                min="0"
                value="${data[weapon][map].deaths}"
                data-map="${map}"
                data-type="deaths"
              >
            </div>
          `).join("")}
        </div>

        <div class="modal-actions">
          <button class="modal-cancel" type="button">Annuler</button>
          <button class="modal-save" type="button">OK</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();

    modal.querySelector(".modal-close").addEventListener("click", closeModal);
    modal.querySelector(".modal-cancel").addEventListener("click", closeModal);

    modal.addEventListener("click", event => {
      if (event.target === modal) {
        closeModal();
      }
    });

    modal.querySelector(".modal-save").addEventListener("click", async () => {
      const saveButton = modal.querySelector(".modal-save");
      saveButton.disabled = true;
      saveButton.textContent = "Sauvegarde...";

      modal.querySelectorAll("input").forEach(input => {
        const map = input.dataset.map;
        const type = input.dataset.type;
        data[weapon][map][type] = Number(input.value) || 0;
      });

      try {
        await saveWeaponToGoogleSheet(weapon);
        closeModal();
      } catch (error) {
        console.error(error);
        saveButton.disabled = false;
        saveButton.textContent = "OK";
        alert("Erreur : sauvegarde impossible.");
      }
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function showSaved() {
    const saved = document.getElementById("saved");

    if (!saved) {
      return;
    }

    saved.classList.add("show");

    setTimeout(() => {
      saved.classList.remove("show");
    }, 900);
  }
}
