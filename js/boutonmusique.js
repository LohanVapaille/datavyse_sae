fetch('js/infosgenre.json')
  .then(res => {
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  })
  .then(infosGenre => {

    (function (infosGenre) {
      const svg = document.querySelector('svg');
    

      // vérifie / crée l'élément audio s'il n'existe pas
      let audio = document.getElementById('genreAudio');
      if (!audio) {
        audio = document.createElement('audio');
        audio.id = 'genreAudio';
        audio.setAttribute('preload', 'metadata');
        document.body.appendChild(audio);
      }

      // configuration (taille et décalage du bouton) 
      const cfg = { r: 25, dy: 42, fill: '#f3f1e8', stroke: '#c9b37a', extraDy: { goldText: 25 } };

      const textIds = ['goldText', 'silverText', 'bronzeText'];
      const buttons = {};
      

      function findGenreInfoByName(name) {
        if (!name) return null;
        let g = infosGenre.find(x => x.genre === name);
        if (!g) g = infosGenre.find(x => x.genre && x.genre.toLowerCase() === name.toLowerCase());
        return g || null;
      }

      function createButtonForText(textEl, idSuffix) {
        const x = parseFloat(textEl.getAttribute('x')) || 0;
        const y = parseFloat(textEl.getAttribute('y')) || 0;
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const gid = idSuffix + 'PlayPause';
        group.setAttribute('id', gid);
        group.setAttribute('class', 'svg-genre-btn');
        
        const tx = x ;
        const ty = y + cfg.dy + (cfg.extraDy[idSuffix] || 0);
        
        
        group.setAttribute('transform', `translate(${tx}, ${ty})`);
        group.setAttribute('role', 'button');
        group.setAttribute('tabindex', '0');
        group.setAttribute('aria-pressed', 'false');
        group.setAttribute('aria-label', `Lire le son pour ${textEl.textContent || idSuffix}`);

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', 0);
        circle.setAttribute('cy', 0);
        circle.setAttribute('r', cfg.r);
        circle.setAttribute('fill', cfg.fill);
        circle.setAttribute('stroke', cfg.stroke);
        circle.setAttribute('stroke-width', '1');

        const play = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const t = Math.round(cfg.r * 0.5);
        play.setAttribute('points', `${-t/1.6},${-t} ${t},0 ${-t/1.6},${t*1.05}`);
        play.setAttribute('class', 'icon play');
        play.setAttribute('fill', '#3a2b00');

        const pauseG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        pauseG.setAttribute('class', 'icon pause');
        pauseG.setAttribute('style', 'display:none;');

        const w = Math.max(4, Math.round(cfg.r * 0.28));
        const h = Math.round(cfg.r * 1.05);
        const rx = Math.round(w * 0.25);

        const rect1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect1.setAttribute('x', -Math.round(w*1.45));
        rect1.setAttribute('y', -Math.round(h/2));
        rect1.setAttribute('width', w);
        rect1.setAttribute('height', h);
        rect1.setAttribute('rx', rx);
        rect1.setAttribute('fill', '#3a2b00');

        const rect2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect2.setAttribute('x', Math.round(w*0.45));
        rect2.setAttribute('y', -Math.round(h/2));
        rect2.setAttribute('width', w);
        rect2.setAttribute('height', h);
        rect2.setAttribute('rx', rx);
        rect2.setAttribute('fill', '#3a2b00');

        pauseG.appendChild(rect1);
        pauseG.appendChild(rect2);

        const stateText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        stateText.setAttribute('x', cfg.r + 8);
        stateText.setAttribute('y', 6);
        stateText.setAttribute('font-size', 12);
        stateText.setAttribute('fill', '#444');
        stateText.setAttribute('id', gid + '-state');
        stateText.textContent = '';

        group.appendChild(circle);
        group.appendChild(play);
        group.appendChild(pauseG);
        group.appendChild(stateText);

        svg.appendChild(group);

        function updateUI(playing) {
          if (playing) {
            play.style.display = 'none';
            pauseG.style.display = 'inline';
            group.setAttribute('aria-pressed', 'true');
            group.setAttribute('aria-label', `Mettre en pause le son ${textEl.textContent || idSuffix}`);
            
          } else {
            play.style.display = 'inline';
            pauseG.style.display = 'none';
            group.setAttribute('aria-pressed', 'false');
            group.setAttribute('aria-label', `Lire le son ${textEl.textContent || idSuffix}`);
            
          }
        }

        let currentSrc = null;
        function setGenreSrc(mp3) {
          currentSrc = mp3 || null;
          if (!currentSrc) {
            group.setAttribute('aria-label', `Aucun son associé à ${textEl.textContent || idSuffix}`);
            circle.setAttribute('opacity', '0.6');
            stateText.textContent = '';
          } else {
            circle.setAttribute('opacity', '1');
            group.setAttribute('aria-label', `Lire le son ${textEl.textContent || idSuffix}`);
            
          }
        }

        async function togglePlay() {
          if (!currentSrc) return;
          // si source différente, on change
          const absSrc = (new URL(currentSrc, location.href)).href;
          if (!audio.src || audio.src !== absSrc) {
            audio.pause();
            audio.src = currentSrc;
            try {
              await audio.play();
              updateUI(true);
            } catch (err) {
              console.warn('Impossible de lancer la lecture :', err);
            }
            return;
          }
          if (audio.paused || audio.ended) {
            try { await audio.play(); updateUI(true); } catch (err) { console.warn(err); }
          } else {
            audio.pause(); updateUI(false);
          }
        }

        audio.addEventListener('play', () => {
          if (currentSrc && audio.src.endsWith(currentSrc)) updateUI(true); else updateUI(false);
        });
        audio.addEventListener('pause', () => updateUI(false));
        audio.addEventListener('ended', () => updateUI(false));

        group.addEventListener('click', togglePlay);
        group.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePlay(); } });

        return { group, setGenreSrc, updateUI };
      }

      // création des boutons
      textIds.forEach(id => {
        const textEl = document.getElementById(id);
        if (!textEl) return console.warn('Texte non trouvé:', id);
        const btnObj = createButtonForText(textEl, id);
        buttons[id] = { textEl, btnObj };
        const genreName = (textEl.textContent || '').trim();
        const info = findGenreInfoByName(genreName);
        if (info) btnObj.setGenreSrc(info.mp3);
        else btnObj.setGenreSrc(null);
      });

      // après la boucle de création des boutons
const timeline = document.getElementById('timeline');
if (timeline) {
  timeline.addEventListener('click', () => {
    // pause l'audio
    if (audio && !audio.paused) {
      audio.pause();
    }
    // met tous les boutons à l'état pause
    Object.values(buttons).forEach(({ btnObj }) => btnObj.updateUI(false));
  });
}


      // observe modifications de texte (si tu mets à jour dynamiquement)
      textIds.forEach(id => {
        const t = document.getElementById(id);
        if (!t) return;
        const obs = new MutationObserver(() => {
          const newName = (t.textContent || '').trim();
          const info = findGenreInfoByName(newName);
          const entry = buttons[id];
          if (entry) entry.btnObj.setGenreSrc(info ? info.mp3 : null);
        });
        obs.observe(t, { characterData: true, childList: true, subtree: true });
      });

      // expose utilitaire
      window.updateButtonForText = function (textId, genreName) {
        const entry = buttons[textId];
        if (!entry) return;
        const info = findGenreInfoByName(genreName);
        entry.btnObj.setGenreSrc(info ? info.mp3 : null);
        entry.btnObj.group.setAttribute('aria-label', info ? `Lire ${genreName}` : `Aucun son`);
      };

    })(infosGenre); 

  })
  .catch(err => {
    console.warn('Erreur chargement JSON infosGenre :', err);
  });