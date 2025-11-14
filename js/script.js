document.addEventListener('DOMContentLoaded', () => {
    function fetchJson(url) {
        return fetch(url).then(function (response) {
            return response.json();
        });
    }

    Promise.all([
        fetchJson('js/data.json'),        // premier fichier (données brutes)
        fetchJson('js/infosgenre.json')  // deuxième fichier (infos couleur par genre)
    ])
        .then(function (results) {
            // results est un tableau [rawData, genreInfos]
            var rawData = results[0];
            var genreInfos = results[1];

            // affiche dans la console pour vérifier le contenu
            console.log('rawData:', rawData);
            console.log('genreInfos:', genreInfos);

            // on veut un objet où la clé est le nom du genre et la valeur est la couleur
            var genreColorMap = {};

            for (var i = 0; i < genreInfos.length; i++) {
                var info = genreInfos[i];
                //met la couleur dans l'objet en utilisant le nom du genre comme clé
                genreColorMap[info.genre] = info.couleur;
            }

            //pour chaque année, garder top5 genres + "Autre" pour compléter à 100%
            var processedData = [];
            for (var r = 0; r < rawData.length; r++) {
                var raw = rawData[r];

                // récupérer l'année
                var annee = raw['année'];
                var genresArray = [];

                // On parcourt toutes les clés de l'objet raw
                for (var key in raw) {

                    if (key === 'année') continue; // on saute la clé "année"

                    var rawValue = raw[key];
                    var numericValue = Number(rawValue);

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

                // calculer la somme des top5 pour calculer autres
                var sommeTop5 = 0;
                for (var s = 0; s < top5.length; s++) {
                    sommeTop5 += top5[s].value;
                }

                // calculer "autres" avec ce qu'on a fait avant
                var valeurAutre = 100 - sommeTop5;


                // construire l'objet formaté pour cette année
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

            //a partir de là j'ai un tableau d'objet, qui contient {année : valeur, Genre1 : valeur, ... Genre5 : valeur , Autre : Valeur}

            // -----------------------------------------------------

            //ici on dessine le canva

            // texte de base dans le SVG
            document.getElementById('goldText').textContent = 'Rock';
            document.getElementById('silverText').textContent = 'Soul';
            document.getElementById('bronzeText').textContent = 'Pop';

            var canvas = document.getElementById('chartCanvas');
            var ctx = canvas.getContext('2d');
            var timeline = document.getElementById('timeline');

            //on prend 1976 par défaut
            var currentRecord = processedData[17];
            var animationFrameId = null;

            // Affiche l'année initiale dans le h3
            yearTitle.textContent = currentRecord.année;

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

                // On ajoute un écouteur d'événement pour réagir au clic sur la frise
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

                        // parcours processedData pour trouver l'objet qui correspond à selectedYear
                        var foundRecord = null;

                        for (var rr = 0; rr < processedData.length; rr++) {
                            if (processedData[rr].année === selectedYear) {
                                foundRecord = processedData[rr];
                                break;
                            }
                        }
                        // Si trouvé, on lance l'animation vers cette année
                        if (foundRecord !== null) {
                            yearTitle.textContent = String(selectedYear);
                            animateTo(foundRecord);
                            updateMedalTexts(foundRecord);


                        }
                    });
                })(box);
            }
            //Fonction qui dessine lees barres sur le canvas

            function drawChart(record, progress) {
                // progress est la proportion d'animation (1 = complet). si non fourni -> 1
                if (progress === undefined) {
                    progress = 1;
                }


                // reset le canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Paramètres d'affichage
                var paddingLeft = 150;
                var paddingTop = 50;
                var barHeight = 40;
                var barGap = 20;
                var maxWidth = canvas.width - paddingLeft - 50;

                // On extrait les paires [genre, valeur] sauf la clé 'année'
                var genrePairs = [];
                for (var cle in record) {
                    if (!record.hasOwnProperty(cle)) continue;
                    if (cle === 'année') continue;
                    genrePairs.push([cle, record[cle]]);
                }

                // Pour chaque genre, on dessine le nom puis la barre
                for (var iG = 0; iG < genrePairs.length; iG++) {
                    var genreName = genrePairs[iG][0];
                    var genreValue = Number(genrePairs[iG][1]) ; // garde un nombre

                    var y = paddingTop + iG * (barHeight + barGap);
                    var barWidth = (genreValue / 100) * maxWidth * progress; // largeur selon la valeur et progression

                    // Nom du genre (à gauche)
                    ctx.fillStyle = '#ffffffff';
                    ctx.textAlign = 'right';
                    ctx.font = '1.2rem "Instrument Sans", sans-serif';
                    ctx.fillText(genreName, paddingLeft - 10, y + barHeight / 1.5);

                    // Barre: on cherche la couleur dans genreColorMap
                    var color = genreColorMap[genreName];

                    ctx.fillStyle = color;
                    ctx.fillRect(paddingLeft, y, barWidth, barHeight);

                    // Pourcentage sur la barre 
                    ctx.fillStyle = '#fff';
                    ctx.textAlign = 'left';
                    var displayValue = Math.round(genreValue * progress);
                    ctx.fillText(displayValue + '%', paddingLeft + 5, y + barHeight / 1.5);
                }

                // Axe horizontal (ligne et graduations)
                var axisY = paddingTop + genrePairs.length * (barHeight + barGap) - barGap / 2;
                ctx.strokeStyle = '#ffffffff';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(paddingLeft, axisY);
                ctx.lineTo(paddingLeft + maxWidth, axisY);
                ctx.stroke();

                // Graduation tous les 10%
                ctx.fillStyle = '#ffffffff';
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
            }

            // Animation entre deux enregistrements
            var depart = currentRecord
            drawChart(depart);

            // Met à jour le <p id="info"> cad la phrase d'exemple pour bien comprendre les stat, avec le premier genre, sa valeur et l'année (version simple) 
            function updateInfo(record) {
                if (!record) return;

                var topGenre = null;
                var topValue = 0;

                // Trouve la valeur max (on ignore uniquement 'année')
                for (var k in record) {
                    if (!record.hasOwnProperty(k)) continue;
                    if (k === 'année') continue;
                    var v = Number(record[k]); // supposé toujours nombre
                    if (v > topValue) {
                        topValue = v;
                        topGenre = k;
                    }
                }

              

                // Construire la phrase
                var phrase = topValue + '% de ' + topGenre + ' dans le classement Billboard de l\'année ' + record.année;

                // Récupère / crée <p id="info">
                var infoEl = document.getElementById('info');
                if (!infoEl) {
                    infoEl = document.createElement('p');
                    infoEl.id = 'info';
                    var canvasEl = document.getElementById('chartCanvas');
                    if (canvasEl && canvasEl.parentNode) canvasEl.parentNode.insertBefore(infoEl, canvasEl);
                    else document.body.appendChild(infoEl);
                }

                infoEl.innerText = "Chaque valeur ci-dessus correspond au pourcentage moyen de musique de ce genre présent dans le classement billboard sur l'année séléctionnée. Par exemple, il y avait en moyenne " + phrase;
            }


            function updateMedalTexts(record) {
                if (!record) return;

                // Extraire tous les genres sauf 'année' et 'Autre'

                const genres = [];
                for (const key in record) {
                    if (key !== 'année' && key !== 'Autre' && record.hasOwnProperty(key)) {
                        genres.push({ name: key, value: record[key] });
                    }
                }

                // Trier du plus grand au plus petit
                genres.sort((a, b) => b.value - a.value);

                // Récupérer les 3 premiers
                const gold = genres[0] ? genres[0].name : '';
                const silver = genres[1] ? genres[1].name : '';
                const bronze = genres[2] ? genres[2].name : '';

                // Mettre à jour le texte dans le SVG
                document.getElementById('goldText').textContent = gold;
                document.getElementById('silverText').textContent = silver;
                document.getElementById('bronzeText').textContent = bronze;
            }



            
            updateInfo(depart);

            function animateTo(arrivee) {
                var duration = 500; // durée en ms
                var startTime = performance.now();

                // Récupérer les valeurs de départ (currentRecord) et d'arrivée dans le même ordre de clés
                var keys = [];
                for (var k in arrivee) {
                    if (!arrivee.hasOwnProperty(k)) continue;
                    if (k === 'année') continue;
                    keys.push(k);
                }

                // startValues et valeurarrivee doivent correspondre à keys par index
                var valeurDepart = [];
                var valeurArrivee = [];
                for (var iKey = 0; iKey < keys.length; iKey++) {
                    var keyName = keys[iKey];
                    valeurDepart.push(Number(depart[keyName]) || 0);
                    valeurArrivee.push(Number(arrivee[keyName]) || 0);
                }

                // Mettre à jour la phrase dès le clic (affiche la cible)
                updateInfo(arrivee);


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
                    var intermediate = { 'année': arrivee.année };
                    for (var iKey2 = 0; iKey2 < keys.length; iKey2++) {
                        var kname = keys[iKey2];
                        var interpolatedValue = valeurDepart[iKey2] + (valeurArrivee[iKey2] - valeurDepart[iKey2]) * progress;
                        intermediate[kname] = interpolatedValue;
                    }

                    // Dessiner ce record intermédiaire
                    drawChart(intermediate);

                    // Si animation pas finie -> demander prochaine frame
                    if (progress < 1) {
                        animationFrameId = requestAnimationFrame(step);
                    } else {
                        // Fin de l'animation : on met à jour currentRecord
                        depart = arrivee;
                        animationFrameId = null;
                    }
                }

                // Lancer la boucle d'animation
                animationFrameId = requestAnimationFrame(step);
            }


            //--------------------------------------------------------------------------------
            // --- Prépare une map complète d'infos par genre (couleur + description + image si dispo) ---
            var genreInfoMap = {}; // clé = nom du genre -> objet { couleur, description, image }
            for (var i = 0; i < genreInfos.length; i++) {
                var info = genreInfos[i];
                // On copie la couleur et d'éventuelles autres infos (description, image) s'il y en a
                genreInfoMap[info.genre] = {
                    couleur: info.couleur,
                    description: info.description , // si ton JSON a un champ 'description'
                    
                };
            }

           
     

            // --- Crée la div tooltip (hidden by default) ---
            var tooltip = document.createElement('div');
            tooltip.id = 'chartTooltip';
            tooltip.style.position = 'fixed';
            tooltip.style.display = 'none';
            tooltip.style.pointerEvents = 'none'; // ne bloque pas la souris
            tooltip.style.padding = '10px';
            tooltip.style.background = 'rgba(255,255,255,0.95)';
            tooltip.style.border = '1px solid rgba(0,0,0,0.15)';
            tooltip.style.boxShadow = '0 6px 18px rgba(0,0,0,0.12)';
            tooltip.style.borderRadius = '6px';
            tooltip.style.maxWidth = '260px';
            tooltip.style.zIndex = 9999;
            tooltip.style.fontSize = '14px';
            tooltip.style.color = '#111';
            document.body.appendChild(tooltip);

            // Helper pour cacher/montrer
            function showTooltip(html, clientX, clientY) {
                tooltip.innerHTML = html;
                tooltip.style.display = 'block';
                // Positionne la tooltip en évitant de sortir de l'écran
                var pad = 12;
                var tw = tooltip.offsetWidth;
                var th = tooltip.offsetHeight;
                var left = clientX + pad;
                if (left + tw > window.innerWidth - 8) left = clientX - pad - tw;
                var top = clientY + pad;
                if (top + th > window.innerHeight - 8) top = clientY - pad - th;
                tooltip.style.left = left + 'px';
                tooltip.style.top = top + 'px';
            }
            function hideTooltip() {
                tooltip.style.display = 'none';
            }

            // --- Détection du survol sur le canvas ---
            // (on se base sur les mêmes paramètres que drawChart)
            canvas.addEventListener('mousemove', function (e) {
                // calcule position souris relative au canvas en tenant compte du scaling CSS -> canvas internal pixels
                var rect = canvas.getBoundingClientRect();
                var scaleX = canvas.width / rect.width;
                var scaleY = canvas.height / rect.height;
                var mouseX = (e.clientX - rect.left) * scaleX;
                var mouseY = (e.clientY - rect.top) * scaleY;

                // mêmes paramètres que drawChart
                var paddingLeft = 150;
                var paddingTop = 50;
                var barHeight = 40;
                var barGap = 20;
                var maxWidth = canvas.width - paddingLeft - 50;

                // recrée la liste des paires (même logique que drawChart)
                var genrePairs = [];
                // on s'appuie sur 'depart' (ou sur current visible record)
                // pour être sûr on peut retrouver le dernier dessiné : on calcule à partir 'depart'
                var latestRecord = depart || processedData[0];
                for (var cle in latestRecord) {
                    if (!latestRecord.hasOwnProperty(cle)) continue;
                    if (cle === 'année') continue;
                    genrePairs.push([cle, latestRecord[cle]]);
                }

                // retrouver l'index de la barre sous la souris
                var relY = mouseY - paddingTop;
                var idx = Math.floor(relY / (barHeight + barGap));
                var hovering = false;
                if (idx >= 0 && idx < genrePairs.length) {
                    var yTop = paddingTop + idx * (barHeight + barGap);
                    if (mouseY >= yTop && mouseY <= yTop + barHeight) {
                        // on est verticalement dans la barre ; maintenant vérifie la largeur (optionnel)
                        var genreValue = Number(genrePairs[idx][1]) || 0;
                        var barWidth = (genreValue / 100) * maxWidth;
                        // si tu veux que le hover s'active même quand on est à droite du bout de la barre,
                        // remplace la condition suivante par `if (mouseX >= paddingLeft && mouseX <= paddingLeft + maxWidth)`
                        if (mouseX >= paddingLeft && mouseX <= paddingLeft + barWidth) {
                            hovering = true;
                        }
                    }
                }

                if (hovering) {
                    var genreName = genrePairs[idx][0];
                    // récupére infos (description + image) depuis genreInfoMap si dispo
                    var info = genreInfoMap[genreName] || {};
                    
                    var descHtml = info.description ? '<div style="margin-top:6px;line-height:1.35;">' + info.description + '</div>' : '';
                    var html = '<strong>' + genreName + '</strong>' + descHtml;

                    showTooltip(html, e.clientX, e.clientY);
                    
                } else {
                    hideTooltip();
                }
            });

            // Cacher tooltip si on sort du canvas
            canvas.addEventListener('mouseleave', function () {
                hideTooltip();
            });




        });

        

}); 