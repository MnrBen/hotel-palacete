/* =======================================================================
   HOTEL PALACETE — JAVASCRIPT
   =======================================================================
   Contenido:
     1. Menú desplegable (móvil)
   ======================================================================= */

/* -----------------------------------------------------------------------
   1. MENÚ DESPLEGABLE (solo móvil)
   Al pulsar el botón de las tres rayas, se abre o cierra el menú.
   En pantallas grandes el botón está oculto por CSS y el menú siempre
   visible, así que este código no tiene efecto ahí.
   ----------------------------------------------------------------------- */
const botonMenu = document.getElementById('botonMenu');
const menu = document.getElementById('menu');

botonMenu.addEventListener('click', () => {
  const estaAbierto = menu.classList.contains('abierto');

  menu.classList.toggle('abierto');

  // Estado para lectores de pantalla (accesibilidad)
  botonMenu.setAttribute('aria-expanded', String(!estaAbierto));
  botonMenu.setAttribute('aria-label', estaAbierto ? 'Abrir menú' : 'Cerrar menú');
});

// Al pulsar un enlace del menú, se cierra automáticamente
menu.querySelectorAll('a').forEach(enlace => {
  enlace.addEventListener('click', () => {
    menu.classList.remove('abierto');
    botonMenu.setAttribute('aria-expanded', 'false');
    botonMenu.setAttribute('aria-label', 'Abrir menú');
  });
});

/* =======================================================================
   VISOR DE FOTOS(carrusel a pantalla completa)
   =======================================================================
   Al pulsar una foto de una habitación se abre a pantalla completa.
     · Escritorio: flechas laterales, teclas ← →, Esc para cerrar.
     · Móvil: se desliza con el dedo (scroll horizontal con anclaje).
     · Se cierra con la X, pulsando fuera de la foto o con Esc.
   Mientras está abierto, la página de fondo no se desplaza.

   El visor se construye desde JavaScript, así no hay que repetir su
   HTML en cada página ni en cada idioma.
   ======================================================================= */
(function () {

  const grupos = document.querySelectorAll('.estancia__fotos');
  if (!grupos.length) return;          // en páginas sin fotos, no hace nada

  /* --- Construcción del visor (una sola vez) --- */
  const visor = document.createElement('div');
  visor.className = 'visor';
  visor.setAttribute('role', 'dialog');
  visor.setAttribute('aria-modal', 'true');
  visor.setAttribute('aria-label', 'Fotos de la habitación');
  visor.hidden = true;
  visor.innerHTML = `
    <button class="visor__cerrar" type="button" aria-label="Cerrar">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>
    </button>
    <button class="visor__flecha visor__flecha--anterior" type="button" aria-label="Foto anterior">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4L7 12l8 8"/></svg>
    </button>
    <button class="visor__flecha visor__flecha--siguiente" type="button" aria-label="Foto siguiente">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4l8 8-8 8"/></svg>
    </button>
    <div class="visor__pista"></div>
    <p class="visor__contador"></p>
  `;
  document.body.appendChild(visor);

  const pista     = visor.querySelector('.visor__pista');
  const contador  = visor.querySelector('.visor__contador');
  const btnCerrar = visor.querySelector('.visor__cerrar');
  const btnAnt    = visor.querySelector('.visor__flecha--anterior');
  const btnSig    = visor.querySelector('.visor__flecha--siguiente');

  let total = 0;
  let indice = 0;
  let origen = null;        // foto desde la que se abrió, para devolver el foco
  let posicionPagina = 0;   // scroll de la página, para restaurarlo al cerrar

  /* --- Abrir --- */
  function abrir(fotos, inicio, disparador) {
    origen = disparador;
    total = fotos.length;
    indice = inicio;

    pista.innerHTML = fotos.map(img => `
      <div class="visor__hueco">
        <img src="${img.getAttribute('src')}" alt="${img.getAttribute('alt') || ''}">
      </div>
    `).join('');

    visor.hidden = false;

    // Bloquear el desplazamiento de la página de fondo
    posicionPagina = window.scrollY;
    document.body.classList.add('sin-scroll');
    document.body.style.top = `-${posicionPagina}px`;

    pista.scrollLeft = indice * pista.clientWidth;
    actualizar();

    btnCerrar.focus();
  }

  /* --- Cerrar --- */
  function cerrar() {
    visor.hidden = true;
    pista.innerHTML = '';

    document.body.classList.remove('sin-scroll');
    document.body.style.top = '';
    window.scrollTo(0, posicionPagina);

    if (origen) origen.focus();
  }

  /* --- Ir a una foto concreta --- */
  function ir(nuevo) {
    indice = Math.max(0, Math.min(total - 1, nuevo));
    pista.scrollTo({ left: indice * pista.clientWidth, behavior: 'smooth' });
    actualizar();
  }

  /* --- Contador y estado de las flechas --- */
  function actualizar() {
    contador.textContent = `${indice + 1} / ${total}`;
    btnAnt.disabled = (indice === 0);
    btnSig.disabled = (indice === total - 1);
  }

  /* --- Al pulsar una foto, se abre su grupo --- */
  grupos.forEach(grupo => {
    const fotos = Array.from(grupo.querySelectorAll('img'));
    fotos.forEach((img, i) => {
      img.tabIndex = 0;                       // accesible con teclado
      img.addEventListener('click', () => abrir(fotos, i, img));
      img.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          abrir(fotos, i, img);
        }
      });
    });
  });

  btnCerrar.addEventListener('click', cerrar);
  btnAnt.addEventListener('click', () => ir(indice - 1));
  btnSig.addEventListener('click', () => ir(indice + 1));

  /* Pulsar fuera de la foto cierra el visor */
  visor.addEventListener('click', e => {
    if (e.target === visor || e.target.classList.contains('visor__hueco')) cerrar();
  });

  /* Teclado */
  document.addEventListener('keydown', e => {
    if (visor.hidden) return;
    if (e.key === 'Escape')     cerrar();
    if (e.key === 'ArrowLeft')  ir(indice - 1);
    if (e.key === 'ArrowRight') ir(indice + 1);
  });

  /* Al deslizar con el dedo, se actualiza el contador */
  let temporizador;
  pista.addEventListener('scroll', () => {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => {
      indice = Math.round(pista.scrollLeft / pista.clientWidth);
      actualizar();
    }, 80);
  }, { passive: true });

})();