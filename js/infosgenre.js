fetch('js/infosgenre.json')
  .then(res => {
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  })
  .then(genres => {
    const container = document.getElementById('genreGrid');

    genres.forEach((g, index) => {
      const card = document.createElement('div');
      card.style.border = `5px solid ${g.couleur || '#000'}`;
      

      const title = document.createElement('h3');
      title.textContent = g.genre;
      card.appendChild(title);

      const desc = document.createElement('p');
      desc.textContent = g.description || '';
      card.appendChild(desc);

      if (g.mp3) {
        const audio = document.createElement('audio');
        audio.src = g.mp3;
        audio.preload = 'metadata';

        const btn = document.createElement('button');
        btn.textContent = '▶️ Play';
        btn.style.cursor = 'pointer';

        btn.addEventListener('click', () => {
          document.querySelectorAll('#genreGrid audio').forEach(a => {
            if (a !== audio) {
              a.pause();
              const otherBtn = a.nextSibling;
              if (otherBtn && otherBtn.tagName === 'BUTTON') otherBtn.textContent = '▶️ Play';
            }
          });

          if (audio.paused) {
            audio.play();
            btn.textContent = '⏸️ Pause';
          } else {
            audio.pause();
            btn.textContent = '▶️ Play';
          }

          audio.onended = () => { btn.textContent = '▶️ Play'; };
        });

        card.appendChild(audio);
        card.appendChild(btn);
      }

      container.appendChild(card);

      // Ajoute le <p> à la dernière carte
      if (index === genres.length - 1) {
        const p = document.createElement('p');
        p.textContent = "Bien que de nombreux genres musicaux existent, nous ne listons ici que ceux qui ont figuré dans le « Top 5 des genres sur une année » d’après le classement Billboard aux États-Unis.";
        card.appendChild(p);
      }
    });
  })
  .catch(err => console.warn('Erreur chargement JSON:', err));
