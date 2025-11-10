
const compteur = document.getElementById('compteur');
const valeurFinale = 42000;
const duree = 2000; // durée de l'animation en ms
const interval = 20; // mise à jour toutes les 20ms
const increment = valeurFinale / (duree / interval);
let current = 0;
let animationLancee = false;

// Fonction pour lancer le compteur
function lancerCompteur() {
  if (animationLancee) return;
  animationLancee = true;
  
  const timer = setInterval(() => {
    current += increment;
    if (current >= valeurFinale) {
      compteur.textContent = valeurFinale.toLocaleString();
      clearInterval(timer);
    } else {
      compteur.textContent = Math.floor(current).toLocaleString();
    }
  }, interval);
}

// Observer pour détecter quand l'élément est visible
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      lancerCompteur();
    }
  });
}, { threshold: 0.5 }); // déclenche quand 50% visible

observer.observe(compteur);

