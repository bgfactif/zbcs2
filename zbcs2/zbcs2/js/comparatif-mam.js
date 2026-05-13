startMamCompare();

function startMamCompare() {
  const app = document.getElementById("app");
  const teams = ["Z/MàM", "B/MàM"];
  const teamNames = {
    "Z/MàM": "Zeko",
    "B/MàM": "Belek"
  };

  init();

  async function init() {
    app.innerHTML = `
      <div class="loader-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;

    try {
      const rows = await loadRowsFromGoogleSheet();
      const data = createDefaultData();
      fillData(data, rows);
      render(data);
    } catch (error) {
      console.error(error);

      app.innerHTML = `
        <div class="sheet-error compare-error">
          <h2>Erreur : impossible de charger le comparatif</h2>
          <p>${escapeHtml(error.message || String(error))}</p>
          <button id="retry-load" type="button">Réessayer</button>
        </div>
      `;

      const retryButton = document.getElementById("retry-load");
      if (retryButton) {
        retryButton.addEventListener("click", init);
      }
    }
  }

  async function loadRowsFromGoogleSheet() {
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
      throw new Error(`Réponse Apps Script pas en JSON. Début réponse: ${text.slice(0, 120)}`);
    }

    if (rows && rows.ok === false) {
      throw new Error(rows.error || "Apps Script a répondu ok:false");
    }

    if (!Array.isArray(rows)) {
      throw new Error("Réponse Google Sheet invalide : ce n'est pas une liste de stats.");
    }

    return rows;
  }

  function createDefaultData() {
    const defaultData = {};

    teams.forEach(team => {
      defaultData[team] = {};

      weapons.forEach(weapon => {
        defaultData[team][weapon] = {};

        maps.forEach(([map]) => {
          defaultData[team][weapon][map] = {
            kills: 0,
            deaths: 0
          };
        });
      });
    });

    return defaultData;
  }

  function fillData(data, rows) {
    rows.forEach(row => {
      const team = String(row.team || "").trim();
      const weapon = String(row.weapon || "").trim();
      const map = String(row.map || "").trim();

      if (
        data[team] &&
        data[team][weapon] &&
        data[team][weapon][map]
      ) {
        data[team][weapon][map].kills = Number(row.kills) || 0;
        data[team][weapon][map].deaths = Number(row.deaths) || 0;
      }
    });
  }

  function render(data) {
    const comparisons = weapons.map(weapon => buildWeaponComparison(data, weapon));
    const summary = buildSummary(comparisons);

    app.innerHTML = `
      <div class="compare-container">
        ${renderSummary(summary)}

        <section class="compare-grid">
          ${comparisons.map(comparison => renderWeaponCard(comparison)).join("")}
        </section>
      </div>
    `;
  }

  function buildWeaponComparison(data, weapon) {
    const zBest = getBestMapForWeapon(data["Z/MàM"][weapon]);
    const bBest = getBestMapForWeapon(data["B/MàM"][weapon]);
    const zTotals = getWeaponTotals(data["Z/MàM"][weapon]);
    const bTotals = getWeaponTotals(data["B/MàM"][weapon]);
    const killGap = Math.abs(zBest.kills - bBest.kills);

    let leader = "draw";
    let message = "Égalité parfaite sur la meilleure map.";

    if (zBest.kills > bBest.kills) {
      leader = "Z/MàM";
      message = `${teamNames["B/MàM"]} est en dessous de ${killGap} kill${killGap > 1 ? "s" : ""}.`;
    } else if (bBest.kills > zBest.kills) {
      leader = "B/MàM";
      message = `${teamNames["Z/MàM"]} est en dessous de ${killGap} kill${killGap > 1 ? "s" : ""}.`;
    }

    return {
      weapon,
      zBest,
      bBest,
      zTotals,
      bTotals,
      leader,
      killGap,
      message
    };
  }

  function getBestMapForWeapon(weaponData) {
    return maps
      .map(([map, logo]) => {
        const stats = weaponData[map] || { kills: 0, deaths: 0 };
        return {
          map,
          logo,
          kills: Number(stats.kills) || 0,
          deaths: Number(stats.deaths) || 0,
          kd: calculateKD(stats.kills, stats.deaths)
        };
      })
      .sort((a, b) => {
        if (b.kills !== a.kills) return b.kills - a.kills;
        return Number(b.kd) - Number(a.kd);
      })[0];
  }

  function getWeaponTotals(weaponData) {
    let kills = 0;
    let deaths = 0;

    maps.forEach(([map]) => {
      kills += Number(weaponData[map].kills) || 0;
      deaths += Number(weaponData[map].deaths) || 0;
    });

    return {
      kills,
      deaths,
      kd: calculateKD(kills, deaths)
    };
  }

  function buildSummary(comparisons) {
    const zWins = comparisons.filter(item => item.leader === "Z/MàM").length;
    const bWins = comparisons.filter(item => item.leader === "B/MàM").length;
    const draws = comparisons.filter(item => item.leader === "draw").length;
    const biggestGap = [...comparisons].sort((a, b) => b.killGap - a.killGap)[0];

    return { zWins, bWins, draws, biggestGap };
  }

  function renderSummary(summary) {
    return `
      <section class="compare-summary">
        <div>
          <p class="eyebrow">Résumé</p>
          <h2>Meilleure map par arme</h2>
        </div>

        <div class="summary-stats">
          <div class="summary-box yellow-box">
            <span>${summary.zWins}</span>
            <small>Avantage Zeko</small>
          </div>
          <div class="summary-box blue-box">
            <span>${summary.bWins}</span>
            <small>Avantage Belek</small>
          </div>
          <div class="summary-box">
            <span>${summary.draws}</span>
            <small>Égalité</small>
          </div>
          <div class="summary-box danger-box">
            <span>${summary.biggestGap ? summary.biggestGap.killGap : 0}</span>
            <small>Plus gros écart</small>
          </div>
        </div>
      </section>
    `;
  }

  function renderWeaponCard(comparison) {
    return `
      <article class="compare-card ${comparison.leader === "Z/MàM" ? "zeko-win" : comparison.leader === "B/MàM" ? "belek-win" : "draw"}">
        <div class="compare-card-top">
          <div>
            <p class="eyebrow">Arme</p>
            <h2>${comparison.weapon}</h2>
          </div>
          <div class="gap-pill">Écart : ${comparison.killGap}</div>
        </div>

        <div class="best-duel">
          ${renderBestSide("Zeko", comparison.zBest, comparison.zTotals, "yellow")}
          ${renderBestSide("Belek", comparison.bBest, comparison.bTotals, "blue")}
        </div>

        <div class="compare-result">
          ${comparison.message}
        </div>
      </article>
    `;
  }

  function renderBestSide(playerName, best, totals, color) {
    return `
      <div class="best-side ${color}">
        <div class="best-map-line">
          <img src="${best.logo}" alt="${best.map}">
          <div>
            <strong>${playerName}</strong>
            <span>${best.map}</span>
          </div>
        </div>

        <div class="best-numbers">
          <span>K : <b>${best.kills}</b></span>
          <span>D : <b>${best.deaths}</b></span>
          <span class="${kdClass(best.kd)}">K/D : <b>${best.kd}</b></span>
        </div>

        <div class="total-line">
          Total arme : ${totals.kills} K / ${totals.deaths} D / <b class="${kdClass(totals.kd)}">${totals.kd}</b>
        </div>
      </div>
    `;
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

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
}
