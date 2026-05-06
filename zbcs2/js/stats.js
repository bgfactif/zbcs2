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
      const response = await fetch(`${API_URL}?t=${Date.now()}`);
      const rows = await response.json();

      rows.forEach(row => {
        const rowTeam = String(row.team).trim();
        const rowWeapon = String(row.weapon).trim();
        const rowMap = String(row.map).trim();

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
        <p class="loading">
          Erreur : Google Sheet ne charge pas.
        </p>
      `;
    }
  }

  async function saveToGoogleSheet(weapon, map) {
    const stats = data[weapon][map];

    await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        team: team,
        weapon: weapon,
        map: map,
        kills: Number(stats.kills) || 0,
        deaths: Number(stats.deaths) || 0
      })
    });

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

    activateInputs();
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

        ${sortedMaps.map(([map, logo]) => renderMapRow(weapon, map, logo)).join("")}
      </article>
    `;
  }

  function renderMapRow(weapon, map, logo) {
    const stats = data[weapon][map];
    const ratio = calculateKD(stats.kills, stats.deaths);

    return `
      <div class="map-row">
        <img src="${logo}" alt="${map}">

        <div class="map-name">${map}</div>

        <input
          type="number"
          min="0"
          placeholder="Kills"
          value="${stats.kills}"
          data-weapon="${weapon}"
          data-map="${map}"
          data-type="kills"
        >

        <input
          type="number"
          min="0"
          placeholder="Deaths"
          value="${stats.deaths}"
          data-weapon="${weapon}"
          data-map="${map}"
          data-type="deaths"
        >

        <div class="kd ${kdClass(ratio)}">
          ${ratio}
        </div>
      </div>
    `;
  }

  function activateInputs() {
    document.querySelectorAll("input").forEach(input => {
      input.addEventListener("change", async () => {
        const weapon = input.dataset.weapon;
        const map = input.dataset.map;
        const type = input.dataset.type;

        data[weapon][map][type] = Number(input.value) || 0;

        await saveToGoogleSheet(weapon, map);
        await loadFromGoogleSheet();

        render();
      });
    });
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