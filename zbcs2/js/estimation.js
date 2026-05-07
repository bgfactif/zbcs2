const RANK_DATA = {
  0: { name: "Non classé", img: "" },
  1: { name: "Silver 1", img: "https://static.totalcsgo.com/totalcsgo-strapi/xxsmall_silver_1_46a99a39f8.png" },
  2: { name: "Silver 2", img: "https://static.totalcsgo.com/totalcsgo-strapi/xxsmall_silver_2_c07d0facdd.png" },
  3: { name: "Silver 3", img: "https://static.totalcsgo.com/totalcsgo-strapi/xxsmall_silver_3_5d1ca03c7e.png" },
  4: { name: "Silver 4", img: "https://static.totalcsgo.com/totalcsgo-strapi/xxsmall_silver_4_0c5d383e29.png" },
  5: { name: "Silver Elite", img: "https://static.totalcsgo.com/totalcsgo-strapi/xxsmall_silver_elite_317c688372.png" },
  6: { name: "Silver Elite Master", img: "https://static.totalcsgo.com/totalcsgo-strapi/xxsmall_silver_elite_master_9717189fe5.png" },
  7: { name: "Gold Nova 1", img: "https://static.totalcsgo.com/totalcsgo-strapi/xxsmall_gold_nova_1_cec4b69c20.png" },
  8: { name: "Gold Nova 2", img: "https://static.totalcsgo.com/totalcsgo-strapi/xxsmall_gold_nova_2_700f45ba47.png" },
  9: { name: "Gold Nova 3", img: "https://static.totalcsgo.com/totalcsgo-strapi/xxsmall_gold_nova_3_78bbea8969.png" },
  10: { name: "Gold Nova Master", img: "https://static.totalcsgo.com/totalcsgo-strapi/xxsmall_gold_nova_master_e0b4e1790f.png" },
  11: { name: "Master Guardian I", img: "https://static.totalcsgo.com/totalcsgo-strapi/xxsmall_master_guardian_1_705461cdaa.png" },
  12: { name: "Master Guardian II", img: "https://static.totalcsgo.com/totalcsgo-strapi/xxsmall_master_guardian_2_34c0aa8b4c.png" },
  13: { name: "Master Guardian Elite", img: "https://static.totalcsgo.com/totalcsgo-strapi/xxsmall_master_guardian_elite_6b4b6401ee.png" },
  14: { name: "Distinguished Master Guardian", img: "https://static.totalcsgo.com/totalcsgo-strapi/xxsmall_distinguished_master_guardian_c867a8385a.png" },
  15: { name: "Legendary Eagle", img: "https://static.totalcsgo.com/totalcsgo-strapi/xxsmall_legendary_eagle_c040258efa.png" },
  16: { name: "Legendary Eagle Master", img: "https://static.totalcsgo.com/totalcsgo-strapi/xxsmall_legendary_eagle_master_4d72faaf57.png" },
  17: { name: "Supreme Master First Class", img: "https://static.totalcsgo.com/totalcsgo-strapi/xxsmall_supreme_master_first_class_d274bcdb5f.png" },
  18: { name: "Global Elite", img: "https://static.totalcsgo.com/totalcsgo-strapi/xxsmall_global_elite_0e7e234eeb.png" }
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

function startEstimation(player) {
  const app = document.getElementById("app");

  const teamByPlayer = {
    zeko: "Z/MàM",
    belek: "B/MàM"
  };

  load();

  async function load() {
    app.innerHTML = `
      <div class="loader-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;

    try {
      const profileResponse = await fetch(
        `${ESTIM_API_URL}?action=estimate&player=${player}&t=${Date.now()}`
      );

      if (!profileResponse.ok) {
        throw new Error("ESTIM_API_URL ne répond pas : " + profileResponse.status);
      }

      const profile = await profileResponse.json();

      const mamResponse = await fetch(`${MAM_API_URL}&t=${Date.now()}`);

      if (!mamResponse.ok) {
        throw new Error("MAM_API_URL ne répond pas : " + mamResponse.status);
      }

      const mamRows = await mamResponse.json();

      const mamStats = buildMamStats(
        mamRows,
        teamByPlayer[player]
      );

      const estimation = buildMamEstimation(mamStats);

      render(profile, mamStats, estimation);

    } catch (error) {
      console.error(error);

      app.innerHTML = `
        <p class="loading">
          Erreur : ${error.message}
        </p>
      `;
    }
  }

  function buildMamStats(rows, team) {
    const filtered = rows.filter(row => String(row.team).trim() === team);

    const totalKills = filtered.reduce((sum, row) => sum + (Number(row.kills) || 0), 0);
    const totalDeaths = filtered.reduce((sum, row) => sum + (Number(row.deaths) || 0), 0);

    const kd = totalDeaths > 0
      ? totalKills / totalDeaths
      : totalKills > 0
        ? totalKills
        : 0;

    const maps = {};

    filtered.forEach(row => {
      const map = String(row.map).trim();

      if (!maps[map]) {
        maps[map] = {
          map,
          kills: 0,
          deaths: 0
        };
      }

      maps[map].kills += Number(row.kills) || 0;
      maps[map].deaths += Number(row.deaths) || 0;
    });

    const mapList = Object.values(maps).map(map => ({
      ...map,
      kd: map.deaths > 0
        ? map.kills / map.deaths
        : map.kills > 0
          ? map.kills
          : 0
    })).sort((a, b) => {
      if (b.kills !== a.kills) return b.kills - a.kills;
      return b.kd - a.kd;
    });

    const playedMaps = mapList.filter(map => map.kills > 0 || map.deaths > 0).length;

    const bestMap = mapList[0] || {
      map: "Aucune",
      kills: 0,
      deaths: 0,
      kd: 0
    };

    return {
      team,
      totalKills,
      totalDeaths,
      kd,
      playedMaps,
      bestMap,
      mapList
    };
  }

  function buildMamEstimation(mam) {
    let score = 0;

    score += mam.totalKills * 0.12;
    score += Math.max(0, mam.kd - 0.80) * 35;
    score += mam.playedMaps * 7;

    if (mam.totalKills >= 100) score += 8;
    if (mam.totalKills >= 250) score += 12;
    if (mam.totalKills >= 500) score += 18;

    if (mam.kd >= 1.00) score += 8;
    if (mam.kd >= 1.15) score += 12;
    if (mam.kd >= 1.30) score += 18;
    if (mam.kd >= 1.50) score += 25;

    score = Math.round(score);

    let premierElo = Math.round((1500 + score * 55) / 100) * 100;

    if (premierElo < 1000) premierElo = 1000;
    if (premierElo > 25000) premierElo = 25000;

    let faceitLevel = 1;

    if (premierElo >= 4500) faceitLevel = 2;
    if (premierElo >= 6500) faceitLevel = 3;
    if (premierElo >= 8500) faceitLevel = 4;
    if (premierElo >= 11000) faceitLevel = 5;
    if (premierElo >= 14000) faceitLevel = 6;
    if (premierElo >= 17000) faceitLevel = 7;
    if (premierElo >= 20000) faceitLevel = 8;
    if (premierElo >= 22500) faceitLevel = 9;
    if (premierElo >= 25000) faceitLevel = 10;

    return {
      score,
      premierElo,
      faceitLevel
    };
  }

  function render(profile, mamStats, estimation) {
    app.innerHTML = `
      <div class="estimation-container">
        ${renderCompetitiveRanks(profile.competitiveRanks || [])}
        ${renderPremierRank(profile.premier || { elo: 0 })}
        ${renderMamRecap(mamStats)}
        ${renderEstimations(estimation)}
      </div>
    `;
  }

  function renderMamRecap(mam) {
    return `
      <section class="estimate-card">
        <div class="estimate-title-row">
          <h2>Stats MàM</h2>
          <p>${mam.team}</p>
        </div>

        <div class="mam-stats-grid">
          ${renderBigStat("Kills", mam.totalKills)}
          ${renderBigStat("Deaths", mam.totalDeaths)}
          ${renderBigStat("K/D", formatKD(mam.kd))}
          ${renderBigStat("Maps jouées", mam.playedMaps)}
        </div>

        <div class="best-mam-map">
          <img src="${mapImages[mam.bestMap.map] || ""}" alt="${mam.bestMap.map}">
          <div>
            <p>Meilleure map MàM</p>
            <h3>${mam.bestMap.map}</h3>
            <div class="mini-stats">
              <span>Kills : ${mam.bestMap.kills}</span>
              <span>Deaths : ${mam.bestMap.deaths}</span>
              <span>K/D : ${formatKD(mam.bestMap.kd)}</span>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function renderEstimations(estimation) {
    return `
      <section class="estimate-card">
        <div class="estimate-title-row">
          <h2>Résultat estimation</h2>
          <p>Premier et Faceit estimés pour MàM</p>
        </div>

        <div class="estimate-results">
          <article class="estimate-result-card main-result">
            <h3>Premier</h3>
            <span>${estimation.premierElo}</span>
            <p>Estimation</p>
          </article>

          <article class="estimate-result-card">
            <h3>Faceit</h3>
            <span>Level ${estimation.faceitLevel}</span>
            <p>Estimation</p>
          </article>

          <article class="estimate-result-card">
            <h3>Score MàM</h3>
            <div class="big-number">${estimation.score}</div>
            <p>Estimation</p>
          </article>
        </div>
      </section>
    `;
  }

  function renderCompetitiveRanks(ranks) {
    return `
      <section class="estimate-card">
        <div class="estimate-title-row">
          <h2>Ranks compétitions</h2>
          <p>Classement actuel</p>
        </div>

        <div class="rank-grid">
          ${ranks.map(rank => renderRankMap(rank)).join("")}
        </div>
      </section>
    `;
  }

  function renderRankMap(rank) {
    const rankInfo = RANK_DATA[rank.rank] || RANK_DATA[0];

    return `
      <article class="rank-map-card">
        <img class="rank-bg" src="${mapImages[rank.map] || ""}" alt="${rank.map}">

        <div class="rank-content">
          <div>
            <h3>${rank.map}</h3>
            <p>${rankInfo.name}</p>
          </div>

          ${
            rankInfo.img
              ? `<img class="rank-img" src="${rankInfo.img}" alt="${rankInfo.name}">`
              : `<div class="no-rank">NC</div>`
          }
        </div>
      </article>
    `;
  }

  function renderPremierRank(premier) {
    const elo = Number(premier.elo) || 0;

    return `
      <section class="estimate-card">
        <div class="estimate-title-row">
          <h2>Rank Premier</h2>
          <p>${elo > 0 ? "Classement actuel" : "Pas de classement"}</p>
        </div>

        <div class="premier-rank-card">
          <div>
            <span>${elo > 0 ? elo : "Non classé"}</span>
            <small>${elo > 0 ? "Elo Premier actuel" : "Premier"}</small>
          </div>
        </div>
      </section>
    `;
  }

  function renderMaps(maps) {
    return `
      <section class="estimate-card">
        <div class="estimate-title-row">
          <h2>Détail MàM par map</h2>
          <p>Trié par kills puis K/D</p>
        </div>

        <div class="mam-map-grid">
          ${maps.map(map => `
            <article class="mam-map-card">
              <img src="${mapImages[map.map] || ""}" alt="${map.map}">
              <div class="mam-map-overlay"></div>

              <div class="mam-map-content">
                <h3>${map.map}</h3>

                <div class="mini-stats">
                  <span>Kills : ${map.kills}</span>
                  <span>Deaths : ${map.deaths}</span>
                  <span>K/D : ${formatKD(map.kd)}</span>
                </div>
              </div>
            </article>
          `).join("")}
        </div>
      </section>
    `;
  }

  function renderBigStat(label, value) {
    return `
      <div class="mam-stat-box">
        <p>${label}</p>
        <span>${value}</span>
      </div>
    `;
  }

  function formatKD(value) {
    return Number(value || 0).toFixed(2);
  }
}