const KEY = 'solmar-city.save.v1';

export function saveGame(state) {
  const player = state.player;
  const data = {
    version: 1, position: [player.position.x, player.position.z], heading: player.heading,
    health: player.health, cash: player.cash, wanted: player.wanted, missionIndex: state.mission.index,
    missionPhase: state.mission.phase, missionComplete: state.mission.complete,
    weapon: player.weapon, ammo: player.ammo,
    stats: { ...state.stats },
  };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.warn('SOLMAR CITY could not save in this browser.', error);
    return false;
  }
}

export function hasSave() {
  try { return Boolean(window.localStorage.getItem(KEY)); }
  catch (error) { console.warn('SOLMAR CITY save storage is unavailable.', error); return false; }
}

export function loadGame(state) {
  let raw;
  try { raw = window.localStorage.getItem(KEY); }
  catch (error) { console.warn('SOLMAR CITY save storage is unavailable.', error); return false; }
  if (!raw) return false;
  try {
    const data = JSON.parse(raw);
    if (data.version !== 1 || !Array.isArray(data.position) || data.position.length !== 2
      || !Number.isFinite(data.position[0]) || !Number.isFinite(data.position[1])) return false;
    state.player.position.set(data.position[0], 0, data.position[1]);
    state.player.heading = Number.isFinite(data.heading) ? data.heading : 0;
    state.player.health = Number.isFinite(data.health) ? data.health : 100;
    state.player.cash = Number.isFinite(data.cash) ? data.cash : 0;
    state.player.wanted = Number.isFinite(data.wanted) ? Math.min(5, Math.max(0, data.wanted)) : 0;
    state.player.weapon = Boolean(data.weapon);
    state.player.ammo = Number.isFinite(data.ammo) ? data.ammo : 0;
    state.mission.index = Number.isInteger(data.missionIndex) ? Math.max(0, Math.min(4, data.missionIndex)) : 0;
    state.mission.phase = Number.isInteger(data.missionPhase) ? Math.max(0, data.missionPhase) : 0;
    state.mission.complete = Boolean(data.missionComplete);
    if (data.stats && Number.isFinite(data.stats.crimes)) Object.assign(state.stats, data.stats);
    return true;
  } catch (error) {
    console.warn('SOLMAR CITY save data could not be read.', error);
    return false;
  }
}
