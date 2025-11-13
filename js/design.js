
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


// Script qui détecte quand un élément avec la classe "fade-in-up-on-scroll" entre dans la fenêtre visible (viewport),
// puis lui ajoute la classe "visible" pour déclencher une animation (ex: effet fade-in vers le haut).

const observer2 = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target); // Stop observing once visible
    }
  });
}, { threshold: 0.1 }); // déclenche dès qu'au moins 10% de l'élément est visible

document.querySelectorAll('.fade-in-up-on-scroll').forEach(elem => {
  observer2.observe(elem);
});




//Script on click pour le menu deroulant du footer avec un boutton pour l'afficher//

document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.querySelector(".dropdown-toggle");
    const menu = document.querySelector(".dropdown-menu");

    toggle.addEventListener("click", (e) => {
        e.stopPropagation();
        menu.classList.toggle("show");
    });

    // Ferme si on clique ailleurs
    document.addEventListener("click", () => {
        menu.classList.remove("show");
    });
});




// ===== HERO VINYL TO VIRAL : scroll CTA ===== //
document.addEventListener("DOMContentLoaded", () => {
  const scrollBtn = document.getElementById("heroScrollBtn");
  const firstSection = document.querySelector(".explication-container");

  if (scrollBtn && firstSection) {
    scrollBtn.addEventListener("click", () => {
      firstSection.scrollIntoView({ behavior: "smooth" });
    });
  }
});
