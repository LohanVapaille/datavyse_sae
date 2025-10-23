// Fonction qui récupère un fichier et renvoie le JSON (promesse)
function fetchJson(url) {
    return fetch(url).then(function (response) {
        return response.json();
    });
}

// On lance les deux fetch en parallèle et on attend les deux résultats
Promise.all([
    fetchJson('js/data.json'),        // premier fichier (données brutes)
    fetchJson('js/infosgenre.json')  // deuxième fichier (infos couleur par genre)
])
    .then(function (results) {
        // results est un tableau [rawData, genreInfos]
        var rawData = results[0];
        var genreInfos = results[1];

        // On affiche dans la console pour vérifier le contenu (utile quand on débute)
        console.log('rawData:', rawData);
        console.log('genreInfos:', genreInfos);

        // on veut un objet où la clé est le nom du genre et la valeur est la couleur
        var genreColorMap = {};
        for (var i = 0; i < genreInfos.length; i++) {
            var info = genreInfos[i];
            // On met la couleur dans l'objet en utilisant le nom du genre comme clé
            genreColorMap[info.genre] = info.couleur;
        }

        // On veut : pour chaque année, garder top5 genres + "Autre" pour compléter à 100%
        var processedData = [];
        for (var r = 0; r < rawData.length; r++) {
            var raw = rawData[r];

            // 3.1 - Récupérer l'année
            var annee = raw['année'];
            var genresArray = [];

            // On parcourt toutes les clés de l'objet raw
            for (var key in raw) {

                if (key === 'année') continue; // on saute la clé "année"

                var rawValue = raw[key];
                var numericValue = Number(rawValue);
                if (!numericValue) {
                    numericValue = 0; // si conversion échoue, on met 0
                }
                genresArray.push({ name: key, value: numericValue });
            }

            // console.log(genresArray);

            // Trier les genres du plus grand au plus petit
            genresArray.sort(function (a, b) {
                return b.value - a.value;
            });

            // Prendre les 5 premiers
            var top5 = [];
            for (var t = 0; t < 5; t++) {
                top5.push(genresArray[t]);
            }

            // Calculer la somme des top5 pour calculer autres
            var sommeTop5 = 0;
            for (var s = 0; s < top5.length; s++) {
                sommeTop5 += top5[s].value;
            }

            // calculer "autres" avec ce qu'on a fait avant
            var valeurAutre = 100 - sommeTop5;


            // Construire l'objet formaté pour cette année
            var resultat = { 'année': annee };

            // Ajouter chaque top5 au resultat, la clé étant le nom du genre
            for (var p = 0; p < top5.length; p++) {
                var g = top5[p];
                resultat[g.name] = g.value;
            }

            resultat['Autre'] = valeurAutre;

            // Ajouter l'objet formaté au tableau final
            processedData.push(resultat);
        }
        console.log(processedData);


        var canvas = document.getElementById('chartCanvas');
        var ctx = canvas.getContext('2d');
        var timeline = document.getElementById('timeline');

        //on prend la première année par défaut)
        var currentRecord = processedData[0];
        var animationFrameId = null;

        // Création de la timeline: on ajoute une div par année
        for (var iBox = 0; iBox < processedData.length; iBox++) {
            var record = processedData[iBox];

            var box = document.createElement('div');
            box.className = 'yearBox';

            // Si l'année est divisible par 5 on affiche le numéro, sinon on laisse vide
            if (record.année % 5 === 0) {
                box.textContent = record.année;
            }

            // On stocke l'année dans l'attribut data-year pour la récupérer au clic
            box.dataset.year = record.année;

            // Si la case correspond à l'année select, on ajoute la classe 'selected'
            if (record.année === currentRecord.année) {
                box.classList.add('selected');
            }
            timeline.appendChild(box);

            // On ajoute un écouteur d'événement pour réagir au clic
            (function (boxElement) {
                boxElement.addEventListener('click', function () {
                    // On récupère l'année select depuis data-year mais comme c un string on la converti!
                    var selectedYear = Number(boxElement.dataset.year);

                    // retirer la classe 'selected' de toutes les cases
                    var boxes = document.querySelectorAll('.yearBox');
                    for (var b = 0; b < boxes.length; b++) {
                        boxes[b].classList.remove('selected');
                    }

                    // Ajouter la classe selected à la case cliquée
                    boxElement.classList.add('selected');
                    var foundRecord = null;
                    // Trouver dans processedData l'objet correspondant à selectedYear

                    for (var rr = 0; rr < processedData.length; rr++) {
                        if (processedData[rr].année === selectedYear) {
                            foundRecord = processedData[rr];
                            break;
                        }
                    }

                    // Si trouvé, on lance l'animation vers cette année
                    if (foundRecord !== null) {
                        animateTo(foundRecord);
                    }
                });
            })(box);
        }
    //Fonction qui dessine le graphique sur le canvas
        
        function drawChart(record, progress) {
            // progress est la proportion d'animation (1 = complet). si non fourni -> 1
            if (typeof progress === 'undefined') {
                progress = 1;
            }

            // Nettoie le canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Paramètres d'affichage
            var paddingLeft = 150;
            var paddingTop = 50;
            var barHeight = 40;
            var barGap = 20;
            var maxWidth = canvas.width - paddingLeft - 50;

            // On extrait les paires [genre, valeur] sauf la clé 'année'
            var genrePairs = [];
            for (var k in record) {
                if (!record.hasOwnProperty(k)) continue;
                if (k === 'année') continue;
                genrePairs.push([k, record[k]]);
            }

            // Pour chaque genre, on dessine le texte (nom) puis la barre
            for (var iG = 0; iG < genrePairs.length; iG++) {
                var genreName = genrePairs[iG][0];
                var genreValue = Number(genrePairs[iG][1]) || 0; // garde un nombre

                var y = paddingTop + iG * (barHeight + barGap);
                var barWidth = (genreValue / 100) * maxWidth * progress; // largeur selon la valeur et progression

                // Nom du genre (à gauche)
                ctx.fillStyle = '#000';
                ctx.textAlign = 'right';
                ctx.font = '16px Arial';
                ctx.fillText(genreName, paddingLeft - 10, y + barHeight / 1.5);

                // Barre: on cherche la couleur dans genreColorMap
                var color = genreColorMap[genreName];
                if (!color) {
                    color = '#999'; // couleur par défaut si non trouvée
                }
                ctx.fillStyle = color;
                ctx.fillRect(paddingLeft, y, barWidth, barHeight);

                // Pourcentage sur la barre (texte blanc)
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'left';
                var displayValue = Math.round(genreValue * progress);
                ctx.fillText(displayValue + '%', paddingLeft + 5, y + barHeight / 1.5);
            }

            // Axe horizontal (ligne et graduations)
            var axisY = paddingTop + genrePairs.length * (barHeight + barGap) - barGap / 2;
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(paddingLeft, axisY);
            ctx.lineTo(paddingLeft + maxWidth, axisY);
            ctx.stroke();

            // Graduation tous les 10%
            ctx.fillStyle = '#000';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            for (var val = 0; val <= 100; val += 10) {
                var x = paddingLeft + (val / 100) * maxWidth;
                ctx.fillText(val + '%', x, axisY + 20);

                ctx.beginPath();
                ctx.moveTo(x, axisY);
                ctx.lineTo(x, axisY + 10);
                ctx.stroke();
            }

            // Afficher l'année en haut à gauche
            ctx.fillStyle = '#000';
            ctx.font = '20px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(String(record.année), 10, 30);
        }

        // Dessin initial
        drawChart(currentRecord);

        // -----------------------------
        // 6) Animation entre deux enregistrements
        // -----------------------------
        function animateTo(targetRecord) {
            var duration = 500; // durée en ms
            var startTime = performance.now();

            // Récupérer les valeurs de départ (currentRecord) et d'arrivée (targetRecord) dans le même ordre de clés
            var keys = [];
            for (var k in targetRecord) {
                if (!targetRecord.hasOwnProperty(k)) continue;
                if (k === 'année') continue;
                keys.push(k);
            }

            // startValues et targetValues doivent correspondre à keys par index
            var startValues = [];
            var targetValues = [];
            for (var iKey = 0; iKey < keys.length; iKey++) {
                var keyName = keys[iKey];
                startValues.push(Number(currentRecord[keyName]) || 0);
                targetValues.push(Number(targetRecord[keyName]) || 0);
            }

            // Annule toute animation en cours
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
            }

            // Fonction qui sera appelée à chaque frame
            function step(now) {
                var elapsed = now - startTime;
                var progress = elapsed / duration;
                if (progress > 1) progress = 1;

                // Construire un record intermédiaire selon la progression
                var intermediate = { 'année': targetRecord.année };
                for (var iKey2 = 0; iKey2 < keys.length; iKey2++) {
                    var kname = keys[iKey2];
                    var interpolatedValue = startValues[iKey2] + (targetValues[iKey2] - startValues[iKey2]) * progress;
                    intermediate[kname] = interpolatedValue;
                }

                // Dessiner ce record intermédiaire
                drawChart(intermediate);

                // Si animation pas finie -> demander prochaine frame
                if (progress < 1) {
                    animationFrameId = requestAnimationFrame(step);
                } else {
                    // Fin de l'animation : on met à jour currentRecord
                    currentRecord = targetRecord;
                    animationFrameId = null;
                }
            }

            // Lancer la boucle d'animation
            animationFrameId = requestAnimationFrame(step);
        }

    })
    .catch(function (err) {
        // Si une erreur survient à n'importe quel moment (fetch ou traitement), on l'affiche
        console.error('Une erreur est survenue :', err);
    });
