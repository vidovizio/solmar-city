import { STORY, missionObjective } from './missions.js';

function mapX(value, width) { return width / 2 + value / 260 * width; }
function mapY(value, height) { return height / 2 + value / 260 * height; }

export function createHud(onAction) {
  const $ = (id) => document.getElementById(id);
  const overlayScreens = ['title', 'paused', 'busted', 'complete'];
  const map = $('minimap');
  const ctx = map.getContext('2d');
  const cash = $('cash'), health = $('health-fill'), healthText = $('health-text');
  const wanted = $('wanted'), objective = $('objective'), speed = $('speed');
  const dialogue = $('dialogue'), banner = $('mission-banner'), ammo = $('ammo');
  const titleContinue = $('continue-button');
  const buttons = document.querySelectorAll('[data-action]');
  buttons.forEach((button) => button.addEventListener('click', () => onAction(button.dataset.action)));

  function showScreen(screen, hasSave = false) {
    for (let i = 0; i < overlayScreens.length; i += 1) {
      const element = $(`${overlayScreens[i]}-screen`);
      element.hidden = overlayScreens[i] !== screen;
    }
    titleContinue.hidden = !hasSave;
    $('mission-list').hidden = true;
  }

  function drawMap(state) {
    const w = map.width, h = map.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#283438'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#65716d'; ctx.lineWidth = 2;
    for (let p = -5; p <= 5; p += 1) {
      const line = p * 26;
      ctx.beginPath(); ctx.moveTo(mapX(line, w), 2); ctx.lineTo(mapX(line, w), h - 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(2, mapY(line, h)); ctx.lineTo(w - 2, mapY(line, h)); ctx.stroke();
    }
    ctx.fillStyle = '#2c8791'; ctx.fillRect(2, mapY(109, h), w - 4, h - mapY(109, h) - 2);
    ctx.fillStyle = '#ddc18d'; ctx.fillRect(2, mapY(100, h), w - 4, (mapY(109, h) - mapY(100, h)));
    if (state.mission.target) {
      let markerX = mapX(state.mission.target.x, w) - w / 2;
      let markerY = mapY(state.mission.target.z, h) - h / 2;
      const markerDistance = Math.hypot(markerX, markerY);
      const markerLimit = Math.min(w, h) / 2 - 7;
      if (markerDistance > markerLimit) {
        markerX = markerX / markerDistance * markerLimit;
        markerY = markerY / markerDistance * markerLimit;
      }
      ctx.fillStyle = '#f1c15f'; ctx.beginPath();
      ctx.arc(w / 2 + markerX, h / 2 + markerY, 4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#ed5c55';
    for (let i = 0; i < state.police.length; i += 1) {
      const unit = state.police[i];
      ctx.beginPath(); ctx.arc(mapX(unit.position.x, w), mapY(unit.position.z, h), 2.7, 0, Math.PI * 2); ctx.fill();
    }
    const p = state.player.position;
    ctx.save(); ctx.translate(mapX(p.x, w), mapY(p.z, h)); ctx.rotate(-state.player.heading);
    ctx.fillStyle = '#f6ede0'; ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(4, 5); ctx.lineTo(0, 3); ctx.lineTo(-4, 5); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function refresh(state) {
    const p = state.player.position;
    $('district').textContent = p.z > 102 ? 'BEACHFRONT' : p.x < -48 ? 'MARINA' : p.z < -48 ? 'HARBOR' : p.x > 48 ? 'DOWNTOWN' : 'OLD TOWN';
    cash.textContent = `$${Math.floor(state.player.cash).toLocaleString()}`;
    health.style.width = `${Math.max(0, state.player.health)}%`;
    healthText.textContent = `${Math.ceil(state.player.health)}%`;
    wanted.textContent = '★'.repeat(state.player.wanted) + '☆'.repeat(5 - state.player.wanted);
    wanted.classList.toggle('hot', state.player.wanted > 0);
    objective.textContent = missionObjective(state);
    speed.hidden = state.player.onFoot;
    if (!state.player.onFoot) speed.textContent = `${Math.round(Math.abs(state.player.car.speed) * 3.6)} KM/H`;
    ammo.hidden = !state.player.weapon;
    if (state.player.weapon) ammo.textContent = state.player.reload > 0 ? 'RELOADING…' : `PISTOL  ${state.player.ammo} / 12`;
    dialogue.textContent = state.mission.dialogue ?? '';
    dialogue.hidden = !dialogue.textContent || state.mission.banner > 0;
    banner.hidden = state.mission.banner <= 0;
    if (state.mission.banner > 0) banner.textContent = state.mission.message;
    $('final-stats').textContent = `JOBS ${Math.min(state.mission.index, STORY.length)}/${STORY.length} · CRIMES ${state.stats.crimes} · GETAWAYS ${state.stats.escapes} · CASH $${Math.floor(state.player.cash).toLocaleString()}`;
    drawMap(state);
    const list = $('mission-entries');
    if (list.childElementCount === 0) {
      for (let i = 0; i < STORY.length; i += 1) {
        const row = document.createElement('li');
        row.textContent = `${i + 1}. ${STORY[i].title} — $${STORY[i].payout.toLocaleString()}`;
        list.append(row);
      }
    }
    if (state.screen === 'title' && hasStorageSave()) titleContinue.hidden = false;
  }

  function hasStorageSave() {
    try { return Boolean(window.localStorage.getItem('solmar-city.save.v1')); }
    catch { return false; }
  }

  return {
    showScreen,
    refresh,
    toggleMissions() { $('mission-list').hidden = !$('mission-list').hidden; },
    announce(text) { $('status').textContent = text; },
  };
}
