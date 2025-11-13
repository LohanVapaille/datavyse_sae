  
    const DATA_URL = 'js/data.json';

 
    const selGenre = document.getElementById('genre');
    const smoothCheckbox = document.getElementById('smooth');
    const showAllBtn = document.getElementById('showAll');
    const footer = document.getElementById('footer');
    const currentCount = document.getElementById('currentCount');

    // Référence au canvas / chart
    const ctx = document.getElementById('musicChart').getContext('2d');
    let chart = null;
    let rawData = null;
    let years = [];      // tableau d'années (trié)
    let genres = [];     // liste des genres

    // Récupération du JSON
    fetch(DATA_URL)
      .then(res => {
        if (!res.ok) throw new Error('Impossible de charger ' + DATA_URL);
        return res.json();
      })
      .then(json => init(json))
      .catch(err => {
        footer.textContent = 'Erreur : ' + err.message;
      });

    function init(data){
      rawData = data.slice();

    
      rawData.forEach(d => d.année = parseInt(d['année'], 10));
      rawData.sort((a,b) => a.année - b.année);

      // Construire la liste d'années 
      years = rawData.map(r => r.année);

      // Extraire les genres disponibles (clés sauf "année")
      const keys = Object.keys(rawData[0] || {});
      genres = keys.filter(k => k !== 'année');

      // Remplir le <select>
      genres.forEach((g, i) => {
        const opt = document.createElement('option');
        opt.value = g;
        opt.textContent = g;
        selGenre.appendChild(opt);
      });

      // Créer le chart initial (vide datasets)
      chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: years.map(String), // Chart.js affichera chaque année (string ok)
          datasets: []
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'nearest', intersect: false },
          plugins: {
  legend: { display: true, labels: { boxWidth:12 } },
  tooltip: {
    callbacks: {
      // titre (ligne du haut du tooltip) -> on met l'année
      title: items => {
        if (!items || !items.length) return '';
        // items[0].label contient l'étiquette X (l'année, car tu as labels = years.map(String))
        return 'Année ' + items[0].label;
      },
      // corps (la ligne par dataset survolé)
      label: item => {
        const v = item.parsed && item.parsed.y;
        const genre = item.dataset && item.dataset.label ? item.dataset.label : 'Genre';
        // récupérer l'année : item.label est l'étiquette X (année)
        const année = item.label ?? chart.data.labels[item.dataIndex];

        if (v === null || v === undefined) return `${genre} : N/A`;

        // formater le nombre en français (virgule) et limiter les décimales si besoin
        const fmt = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
        const valueStr = fmt.format(v);

        return `${valueStr}% de ${genre} dans le classement de ${année}`;
      }
    }
  }
}
,
          scales: {
            x: {
              title: { display: true, text: 'Année' },
              ticks: { maxRotation: 0, autoSkip: true }
            },
            y: {
              title: { display: true, text: 'Valeur' },
              beginAtZero: true
            }
          },
          elements: {
            line: {
              tension: 0.2,
              borderWidth: 2
            },
            point: {
              radius: 3,
              hoverRadius: 5
            }
          }
        }
      });

     
      selGenre.addEventListener('change', () => updateSingleGenre(selGenre.value));
      smoothCheckbox.addEventListener('change', () => {
        // met à jour la "tension" de la courbee
        chart.data.datasets.forEach(ds => ds.tension = smoothCheckbox.checked ? 0.4 : 0.0);
        chart.update();
      });
      showAllBtn.addEventListener('click', () => updateAllGenres());

      // Affiche par défaut le premier genre
      if (genres.length) {
        selGenre.value = genres[0];
        updateSingleGenre(genres[0]);
      }
      footer.textContent = "Données officielles du Billboard depuis 1959 jusqu'à 2025";
    }

    // Convertit une valeur (string/number/empty) en number ou null
    function parseVal(v){
      if (v === null || v === undefined) return null;
      if (typeof v === 'number') return Number.isFinite(v) ? v : null;
      if (typeof v === 'string') {
        const s = v.trim();
        if (s === '') return null;
        const n = Number(s.replace(',', '.'));
        return Number.isFinite(n) ? n : null;
      }
      return null;
    }

    // Crée un dataset pour un genre (aligné sur years)
    function buildDatasetForGenre(genre, color, hidden=false){
      const dataArr = rawData.map(row => {
        const val = parseVal(row[genre]);
        return val === null ? null : val;
      });
      return {
        label: genre,
        data: dataArr,
        borderColor: color,
        backgroundColor: color,
        spanGaps: false,
        tension: smoothCheckbox.checked ? 0.4 : 0.0,
        pointRadius: 3,
        showLine: true,
        hidden
      };
    }

    // Palette simple
    const palette = [
      '#60a5fa','#f472b6','#34d399','#f59e0b','#a78bfa','#fb7185','#60a5fa','#f97316',
      '#3b82f6','#10b981','#ef4444','#06b6d4','#6366f1','#14b8a6'
    ];

    // Met à jour le graphique pour un seul genre
    function updateSingleGenre(genre){
      chart.data.datasets = [];
      // couleur
      const color = palette[genres.indexOf(genre) % palette.length];
      chart.data.datasets.push(buildDatasetForGenre(genre, color));
      chart.options.plugins.legend.display = true;
      chart.update();
      // compteur d'années non-null
      const values = rawData.map(r => parseVal(r[genre]));
      const count = values.filter(v => v !== null).length;
      currentCount.textContent = `${genre} — ${count} valeurs présentes`;
    }

    // Afficher tous les genres (toggle)
    let showingAll = false;
    function updateAllGenres(){
      showingAll = !showingAll;
      showAllBtn.textContent = showingAll ? 'Afficher un seul genre' : 'Afficher tous les genres';
      if (!showingAll) {
        // revenir au seul genre sélectionné
        updateSingleGenre(selGenre.value);
        return;
      }
      // Ajouter tous les datasets
      chart.data.datasets = genres.map((g,i) => {
        const color = palette[i % palette.length];
        return buildDatasetForGenre(g, color, false);
      });
      chart.update();
      currentCount.textContent = `Tous les genres (${genres.length}) affichés — click sur le bouton pour revenir`;
    }
